// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test} from "forge-std/Test.sol";
import {Helix} from "../src/Helix.sol";

contract HelixTest is Test {
    Helix helix;
    address alice = address(0xA11CE);
    address bob = address(0xB0B);

    function setUp() public {
        helix = new Helix();
    }

    function test_UploadCreatesFirstVersion() public {
        vm.prank(alice);
        helix.uploadFile("report.pdf", "QmCid1");

        Helix.FileVersion[] memory versions = helix.getVersions(alice, "report.pdf");
        assertEq(versions.length, 1);
        assertEq(versions[0].version, 1);
        assertEq(versions[0].cid, "QmCid1");
    }

    function test_SecondUploadAppendsVersionTwo() public {
        vm.startPrank(alice);
        helix.uploadFile("report.pdf", "QmCid1");
        helix.uploadFile("report.pdf", "QmCid2");
        vm.stopPrank();

        Helix.FileVersion[] memory versions = helix.getVersions(alice, "report.pdf");
        assertEq(versions.length, 2);
        assertEq(versions[1].version, 2);
        assertEq(versions[1].cid, "QmCid2");
        assertEq(helix.getLatestCid(alice, "report.pdf"), "QmCid2");
    }

    function test_FilenamesListedOncePerOwner() public {
        vm.startPrank(alice);
        helix.uploadFile("report.pdf", "QmCid1");
        helix.uploadFile("report.pdf", "QmCid2");
        helix.uploadFile("notes.txt", "QmCid3");
        vm.stopPrank();

        string[] memory files = helix.getFiles(alice);
        assertEq(files.length, 2);
        assertEq(files[0], "report.pdf");
        assertEq(files[1], "notes.txt");
    }

    function test_OwnersAreIsolated() public {
        vm.prank(alice);
        helix.uploadFile("shared-name.txt", "QmAliceCid");

        vm.prank(bob);
        helix.uploadFile("shared-name.txt", "QmBobCid");

        assertEq(helix.getVersionCount(alice, "shared-name.txt"), 1);
        assertEq(helix.getVersionCount(bob, "shared-name.txt"), 1);
        assertEq(helix.getLatestCid(alice, "shared-name.txt"), "QmAliceCid");
        assertEq(helix.getLatestCid(bob, "shared-name.txt"), "QmBobCid");
    }

    function test_RevertsOnEmptyFilename() public {
        vm.prank(alice);
        vm.expectRevert(bytes("Helix: filename required"));
        helix.uploadFile("", "QmCid1");
    }

    function test_RevertsOnEmptyCid() public {
        vm.prank(alice);
        vm.expectRevert(bytes("Helix: cid required"));
        helix.uploadFile("report.pdf", "");
    }

    function test_RevertsOnLatestCidForUnknownFile() public {
        vm.expectRevert(bytes("Helix: no versions for file"));
        helix.getLatestCid(alice, "does-not-exist.txt");
    }
}
