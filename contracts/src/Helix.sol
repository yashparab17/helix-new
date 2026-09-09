// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title Helix
/// @notice Minimal on-chain linear version-control ledger for IPFS-hosted files.
/// @dev The contract stores no file bytes. It only records, per (owner, filename),
///      an append-only array of IPFS CIDs. Each append is a new "version".
///      This is intentionally simple: two mappings and one write function.
contract Helix {
    /// @notice A single recorded version of a file.
    struct FileVersion {
        string cid;        // IPFS Content Identifier for this version
        uint256 version;   // 1-indexed, monotonically increasing per filename
        uint256 timestamp; // block.timestamp at time of upload
    }

    /// @dev owner => filename => ordered list of versions (index 0 = version 1)
    mapping(address => mapping(string => FileVersion[])) private _versions;

    /// @dev owner => list of distinct filenames that owner has ever uploaded
    mapping(address => string[]) private _filenames;

    /// @dev owner => filename => whether it has already been registered in _filenames
    mapping(address => mapping(string => bool)) private _isKnownFilename;

    /// @notice Emitted every time a new version of a file is appended.
    event FileUploaded(
        address indexed owner,
        string filename,
        string cid,
        uint256 version,
        uint256 timestamp
    );

    /// @notice Append a new version (new CID) for `filename`, owned by the caller.
    /// @dev The caller's wallet address is always msg.sender — nobody can upload
    ///      on behalf of another address. Version numbers start at 1 and increase
    ///      by exactly 1 on every call for a given (owner, filename) pair.
    /// @param filename Human-readable name/key for the file (e.g. "notes.txt").
    /// @param cid The IPFS CID returned by Pinata after pinning the file.
    function uploadFile(string calldata filename, string calldata cid) external {
        require(bytes(filename).length > 0, "Helix: filename required");
        require(bytes(cid).length > 0, "Helix: cid required");

        if (!_isKnownFilename[msg.sender][filename]) {
            _isKnownFilename[msg.sender][filename] = true;
            _filenames[msg.sender].push(filename);
        }

        uint256 nextVersion = _versions[msg.sender][filename].length + 1;

        _versions[msg.sender][filename].push(
            FileVersion({cid: cid, version: nextVersion, timestamp: block.timestamp})
        );

        emit FileUploaded(msg.sender, filename, cid, nextVersion, block.timestamp);
    }

    /// @notice Returns every filename `owner` has ever uploaded (insertion order).
    function getFiles(address owner) external view returns (string[] memory) {
        return _filenames[owner];
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
