// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {SafeDealEscrow} from "../src/SafeDealEscrow.sol";

contract DeploySafeDealEscrow is Script {
    function run() external returns (SafeDealEscrow escrow) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);
        escrow = new SafeDealEscrow();
        vm.stopBroadcast();

        console2.log("SafeDealEscrow deployed to:", address(escrow));
    }
}
