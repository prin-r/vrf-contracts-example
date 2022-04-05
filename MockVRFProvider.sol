// SPDX-License-Identifier: Apache-2.0

pragma solidity 0.8.4;
pragma abicoder v2;

import {IBridge} from "./IBridge.sol";
import {VRFProviderBase} from "./VRFProviderBase.sol";

contract MockVRFProvider is VRFProviderBase {
    constructor(
        IBridge _bridge,
        uint64 _oracleScriptID,
        uint64 _minCount,
        uint64 _askCount
    ) VRFProviderBase(_bridge, _oracleScriptID, _minCount, _askCount) {}

    function getBlockTime() public view override returns (uint64) {
        return uint64(1631010808);
    }

    function getBlockLatestHash() public view override returns (bytes32) {
        // Just return some random hash for testing
        return
            hex"61045f446e2ee45c19788fafb789e9fef9994c8897a4fde62759c1f648f1c1a3";
    }
}
