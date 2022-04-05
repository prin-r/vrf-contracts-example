// SPDX-License-Identifier: Apache-2.0

pragma solidity 0.8.4;

import {IVRFProvider} from "./IVRFProvider.sol";
import {IVRFConsumer} from "./IVRFConsumer.sol";

abstract contract VRFConsumerBase is IVRFConsumer {
    IVRFProvider public provider;

    function consume(
        string calldata seed,
        uint64 time,
        bytes32 result
    ) external override {
        require(msg.sender == address(provider), "Caller is not the provider");
        _consume(seed, time, result);
    }

    function _consume(
        string calldata seed,
        uint64 time,
        bytes32 result
    ) internal virtual {
        revert("Unimplemented");
    }
}
