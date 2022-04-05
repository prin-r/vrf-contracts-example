// SPDX-License-Identifier: Apache-2.0

pragma solidity 0.8.4;
pragma abicoder v2;

import {IBridge} from "./IBridge.sol";
import {VRFProviderBase} from "./VRFProviderBase.sol";

contract VRFProvider is VRFProviderBase {
    constructor(
        IBridge _bridge,
        uint64 _oracleScriptID,
        uint64 _minCount,
        uint64 _askCount
    ) VRFProviderBase(_bridge, _oracleScriptID, _minCount, _askCount) {}
}
