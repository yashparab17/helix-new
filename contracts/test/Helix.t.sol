// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test} from "forge-std/Test.sol";
import {Helix} from "../src/Helix.sol";

contract HelixTest is Test {
    Helix helix;
    address alice = address(0xA11CE);
    address bob = address(0xB0B);
    address carol = address(0xCA401);

    function setUp() public {
        helix = new Helix();
    }

    function test_UploadCreatesFirstVersion() public {
        vm.prank(alice);
        helix.uploadFile(alice, "report.pdf", "QmCid1");

        Helix.FileVersion[] memory versions = helix.getVersions(alice, "report.pdf");
        assertEq(versions.length, 1);
        assertEq(versions[0].version, 1);
        assertEq(versions[0].cid, "QmCid1");
        assertEq(versions[0].uploader, alice);
    }

    function test_SecondUploadAppendsVersionTwo() public {
        vm.startPrank(alice);
        helix.uploadFile(alice, "report.pdf", "QmCid1");
        helix.uploadFile(alice, "report.pdf", "QmCid2");
        vm.stopPrank();

        Helix.FileVersion[] memory versions = helix.getVersions(alice, "report.pdf");
        assertEq(versions.length, 2);
        assertEq(versions[1].version, 2);
        assertEq(versions[1].cid, "QmCid2");
        assertEq(helix.getLatestCid(alice, "report.pdf"), "QmCid2");
    }

    function test_FilenamesListedOncePerOwner() public {
        vm.startPrank(alice);
        helix.uploadFile(alice, "report.pdf", "QmCid1");
        helix.uploadFile(alice, "report.pdf", "QmCid2");
        helix.uploadFile(alice, "notes.txt", "QmCid3");
        vm.stopPrank();

        string[] memory files = helix.getFiles(alice);
        assertEq(files.length, 2);
        assertEq(files[0], "report.pdf");
        assertEq(files[1], "notes.txt");
    }

    function test_OwnersAreIsolated() public {
        vm.prank(alice);
        helix.uploadFile(alice, "shared-name.txt", "QmAliceCid");

        vm.prank(bob);
        helix.uploadFile(bob, "shared-name.txt", "QmBobCid");

        assertEq(helix.getVersionCount(alice, "shared-name.txt"), 1);
        assertEq(helix.getVersionCount(bob, "shared-name.txt"), 1);
        assertEq(helix.getLatestCid(alice, "shared-name.txt"), "QmAliceCid");
        assertEq(helix.getLatestCid(bob, "shared-name.txt"), "QmBobCid");
    }

    function test_RevertsOnEmptyFilename() public {
        vm.prank(alice);
        vm.expectRevert(bytes("Helix: filename required"));
        helix.uploadFile(alice, "", "QmCid1");
    }

    function test_RevertsOnEmptyCid() public {
        vm.prank(alice);
        vm.expectRevert(bytes("Helix: cid required"));
        helix.uploadFile(alice, "report.pdf", "");
    }

    function test_RevertsOnLatestCidForUnknownFile() public {
        vm.expectRevert(bytes("Helix: no versions for file"));
        helix.getLatestCid(alice, "does-not-exist.txt");
    }

    // --- Collaborators ---

    function test_StrangerCannotUploadToAnotherOwner() public {
        vm.prank(bob);
        vm.expectRevert(bytes("Helix: not authorized for this owner"));
        helix.uploadFile(alice, "report.pdf", "QmCid1");
    }

    function test_OwnerCanAddCollaboratorWhoCanThenUpload() public {
        vm.prank(alice);
        helix.addCollaborator(bob);

        vm.prank(bob);
        helix.uploadFile(alice, "report.pdf", "QmFromBob");

        Helix.FileVersion[] memory versions = helix.getVersions(alice, "report.pdf");
        assertEq(versions.length, 1);
        assertEq(versions[0].cid, "QmFromBob");
        assertEq(versions[0].uploader, bob);
    }

    function test_CollaboratorAndOwnerBuildSharedLinearHistory() public {
        vm.prank(alice);
        helix.addCollaborator(bob);

        vm.prank(alice);
        helix.uploadFile(alice, "report.pdf", "QmV1FromAlice");

        vm.prank(bob);
        helix.uploadFile(alice, "report.pdf", "QmV2FromBob");

        Helix.FileVersion[] memory versions = helix.getVersions(alice, "report.pdf");
        assertEq(versions.length, 2);
        assertEq(versions[0].uploader, alice);
        assertEq(versions[1].uploader, bob);
        assertEq(versions[1].version, 2);
    }

    function test_RemovedCollaboratorLosesUploadRights() public {
        vm.startPrank(alice);
        helix.addCollaborator(bob);
        helix.removeCollaborator(bob);
        vm.stopPrank();

        vm.prank(bob);
        vm.expectRevert(bytes("Helix: not authorized for this owner"));
        helix.uploadFile(alice, "report.pdf", "QmCid1");
    }

    function test_GetCollaboratorsReturnsOnlyActiveOnes() public {
        vm.startPrank(alice);
        helix.addCollaborator(bob);
        helix.addCollaborator(carol);
        helix.removeCollaborator(bob);
        vm.stopPrank();

        address[] memory active = helix.getCollaborators(alice);
        assertEq(active.length, 1);
        assertEq(active[0], carol);
    }

    function test_IsCollaboratorReflectsCurrentState() public {
        assertFalse(helix.isCollaborator(alice, bob));

        vm.prank(alice);
        helix.addCollaborator(bob);
        assertTrue(helix.isCollaborator(alice, bob));

        vm.prank(alice);
        helix.removeCollaborator(bob);
        assertFalse(helix.isCollaborator(alice, bob));
    }

    function test_RevertsAddingSelfAsCollaborator() public {
        vm.prank(alice);
        vm.expectRevert(bytes("Helix: cannot add yourself"));
        helix.addCollaborator(alice);
    }

    function test_RevertsAddingDuplicateCollaborator() public {
        vm.startPrank(alice);
        helix.addCollaborator(bob);
        vm.expectRevert(bytes("Helix: already a collaborator"));
        helix.addCollaborator(bob);
        vm.stopPrank();
    }

    function test_RevertsRemovingNonCollaborator() public {
        vm.prank(alice);
        vm.expectRevert(bytes("Helix: not a collaborator"));
        helix.removeCollaborator(bob);
    }

    function test_CollaboratorOnOneOwnerCannotUploadForAnotherOwner() public {
        vm.prank(alice);
        helix.addCollaborator(bob);

        // bob can upload for alice, but that grants nothing on carol's behalf
        vm.prank(bob);
        vm.expectRevert(bytes("Helix: not authorized for this owner"));
        helix.uploadFile(carol, "report.pdf", "QmCid1");
    }
}
