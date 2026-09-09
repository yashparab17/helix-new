// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {Helix} from "../src/Helix.sol";

/// @notice Deploys Helix. Run against a local Anvil node (see USAGE.md).
contract DeployHelix is Script {
    function run() external returns (Helix) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerKey);
        Helix helix = new Helix();
        vm.stopBroadcast();

        console.log("Helix deployed at:", address(helix));
        return helix;
    }
}
