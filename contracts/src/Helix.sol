// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title Helix
/// @notice Minimal on-chain linear version-control ledger for IPFS-hosted files,
///         with optional collaborators who may upload on an owner's behalf.
/// @dev The contract stores no file bytes. It only records, per (owner, filename),
///      an append-only array of IPFS CIDs. Each append is a new "version".
contract Helix {
    /// @notice A single recorded version of a file.
    struct FileVersion {
        string cid;         // IPFS Content Identifier for this version
        uint256 version;    // 1-indexed, monotonically increasing per filename
        uint256 timestamp;  // block.timestamp at time of upload
        address uploader;   // who actually submitted this version (owner or collaborator)
    }

    /// @dev owner => filename => ordered list of versions (index 0 = version 1)
    mapping(address => mapping(string => FileVersion[])) private _versions;

    /// @dev owner => list of distinct filenames that owner has ever uploaded
    mapping(address => string[]) private _filenames;

    /// @dev owner => filename => whether it has already been registered in _filenames
    mapping(address => mapping(string => bool)) private _isKnownFilename;

    /// @dev owner => collaborator => currently allowed to upload on owner's behalf
    mapping(address => mapping(address => bool)) private _isCollaborator;

    /// @dev owner => every address ever added as a collaborator (may include
    ///      since-removed ones — filter through _isCollaborator to get the active set)
    mapping(address => address[]) private _collaboratorHistory;

    /// @dev owner => filename => currently hidden from default (getVisibleFiles) listings.
    ///      This does not delete or move any data — the file's full history remains
    ///      readable via getFiles/getVersions for anyone who queries it directly.
    mapping(address => mapping(string => bool)) private _isHidden;

    /// @notice Emitted every time a new version of a file is appended.
    event FileUploaded(
        address indexed owner,
        address indexed uploader,
        string filename,
        string cid,
        uint256 version,
        uint256 timestamp
    );

    /// @notice Emitted when an owner grants upload rights to a collaborator.
    event CollaboratorAdded(address indexed owner, address indexed collaborator);

    /// @notice Emitted when an owner revokes a collaborator's upload rights.
    event CollaboratorRemoved(address indexed owner, address indexed collaborator);

    /// @notice Emitted when an owner hides a file from default listings.
    event FileHidden(address indexed owner, string filename);

    /// @notice Emitted when an owner unhides a previously hidden file.
    event FileUnhidden(address indexed owner, string filename);

    modifier onlyOwnerOrCollaborator(address owner) {
        require(
            msg.sender == owner || _isCollaborator[owner][msg.sender],
            "Helix: not authorized for this owner"
        );
        _;
    }

    /// @notice Grants `collaborator` permission to upload new versions to every
    ///         file the caller owns (present and future).
    function addCollaborator(address collaborator) external {
        require(collaborator != address(0), "Helix: invalid collaborator");
        require(collaborator != msg.sender, "Helix: cannot add yourself");
        require(!_isCollaborator[msg.sender][collaborator], "Helix: already a collaborator");

        _isCollaborator[msg.sender][collaborator] = true;
        _collaboratorHistory[msg.sender].push(collaborator);

        emit CollaboratorAdded(msg.sender, collaborator);
    }

    /// @notice Revokes a collaborator's upload permission. Versions they already
    ///         uploaded are untouched — this only affects future uploads.
    function removeCollaborator(address collaborator) external {
        require(_isCollaborator[msg.sender][collaborator], "Helix: not a collaborator");

        _isCollaborator[msg.sender][collaborator] = false;

        emit CollaboratorRemoved(msg.sender, collaborator);
    }

    /// @notice Returns `owner`'s currently active collaborators (removed ones excluded).
    function getCollaborators(address owner) external view returns (address[] memory) {
        address[] storage history = _collaboratorHistory[owner];

        uint256 activeCount;
        for (uint256 i = 0; i < history.length; i++) {
            if (_isCollaborator[owner][history[i]]) activeCount++;
        }

        address[] memory active = new address[](activeCount);
        uint256 j;
        for (uint256 i = 0; i < history.length; i++) {
            if (_isCollaborator[owner][history[i]]) {
                active[j] = history[i];
                j++;
            }
        }
        return active;
    }

    /// @notice Whether `who` currently has upload rights on `owner`'s files.
    function isCollaborator(address owner, address who) external view returns (bool) {
        return _isCollaborator[owner][who];
    }

    /// @notice Append a new version (new CID) for `owner`'s `filename`.
    /// @dev Callable by `owner` themselves, or by any address `owner` has added
    ///      as a collaborator. Version numbers start at 1 and increase by
    ///      exactly 1 on every call for a given (owner, filename) pair,
    ///      regardless of who submits it.
    /// @param owner The wallet whose file history this version is appended to.
    /// @param filename Human-readable name/key for the file (e.g. "notes.txt").
    /// @param cid The IPFS CID returned by Pinata after pinning the file.
    function uploadFile(address owner, string calldata filename, string calldata cid)
        external
        onlyOwnerOrCollaborator(owner)
    {
        require(bytes(filename).length > 0, "Helix: filename required");
        require(bytes(cid).length > 0, "Helix: cid required");

        if (!_isKnownFilename[owner][filename]) {
            _isKnownFilename[owner][filename] = true;
            _filenames[owner].push(filename);
        }

        uint256 nextVersion = _versions[owner][filename].length + 1;

        _versions[owner][filename].push(
            FileVersion({
                cid: cid,
                version: nextVersion,
                timestamp: block.timestamp,
                uploader: msg.sender
            })
        );

        emit FileUploaded(owner, msg.sender, filename, cid, nextVersion, block.timestamp);
    }

    /// @notice Returns every filename `owner` has ever uploaded (insertion order),
    ///         including hidden ones. Use getVisibleFiles for the filtered list.
    function getFiles(address owner) external view returns (string[] memory) {
        return _filenames[owner];
    }

    /// @notice Hides `filename` from getVisibleFiles. Only the file's owner can
    ///         hide it (not collaborators) — this is purely a display setting,
    ///         not a deletion: the full history stays intact and readable via
    ///         getFiles/getVersions for anyone who queries them directly.
    function hideFile(string calldata filename) external {
        require(_isKnownFilename[msg.sender][filename], "Helix: unknown file");
        require(!_isHidden[msg.sender][filename], "Helix: already hidden");

        _isHidden[msg.sender][filename] = true;
        emit FileHidden(msg.sender, filename);
    }

    /// @notice Reverses hideFile — the file reappears in getVisibleFiles.
    function unhideFile(string calldata filename) external {
        require(_isHidden[msg.sender][filename], "Helix: not hidden");

        _isHidden[msg.sender][filename] = false;
        emit FileUnhidden(msg.sender, filename);
    }

    /// @notice Whether `owner` has hidden `filename`.
    function isFileHidden(address owner, string calldata filename) external view returns (bool) {
        return _isHidden[owner][filename];
    }

    /// @notice Like getFiles, but excludes hidden filenames. This is what
    ///         public/shared views should call so hidden files never appear
    ///         to anyone browsing an owner's repository.
    function getVisibleFiles(address owner) external view returns (string[] memory) {
        string[] storage all = _filenames[owner];

        uint256 visibleCount;
        for (uint256 i = 0; i < all.length; i++) {
            if (!_isHidden[owner][all[i]]) visibleCount++;
        }

        string[] memory visible = new string[](visibleCount);
        uint256 j;
        for (uint256 i = 0; i < all.length; i++) {
            if (!_isHidden[owner][all[i]]) {
                visible[j] = all[i];
                j++;
            }
        }
        return visible;
    }

    /// @notice Returns the full linear version history for `owner`'s `filename`,
    ///         oldest version first.
    function getVersions(address owner, string calldata filename)
        external
        view
        returns (FileVersion[] memory)
    {
        return _versions[owner][filename];
    }

    /// @notice Returns just the number of versions recorded for `owner`'s `filename`.
    function getVersionCount(address owner, string calldata filename)
        external
        view
        returns (uint256)
    {
        return _versions[owner][filename].length;
    }

    /// @notice Convenience getter: the current (latest) CID for `owner`'s `filename`.
    /// @dev Reverts if the file has never been uploaded.
    function getLatestCid(address owner, string calldata filename)
        external
        view
        returns (string memory)
    {
        FileVersion[] storage v = _versions[owner][filename];
        require(v.length > 0, "Helix: no versions for file");
        return v[v.length - 1].cid;
    }
}
