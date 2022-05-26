// SPDX-License-Identifier: Apache-2.0

pragma solidity 0.8.4;
pragma abicoder v2;

import {Obi} from "../../obi/Obi.sol";

/// @title ParamsDecoder library
/// @notice Library for decoding the OBI-encoded input parameters of a VRF data request
library VRFDecoder {
    using Obi for Obi.Data;

    struct Params {
        string seed;
        uint64 time;
        address taskWorker;
    }

    struct Result {
        bytes result;
        bytes proof;
    }

    function bytesToAddress(bytes memory addressBytes) internal pure returns(address addr) {
        require(addressBytes.length == 20, "DATA_DECODE_INVALID_SIZE_FOR_ADDRESS");
        assembly {
            addr := mload(add(addressBytes, 20))
        }
    }

    /// @notice Decodes the encoded request input parameters
    /// @param encodedParams Encoded paramter data
    function decodeParams(bytes memory encodedParams)
        internal
        pure
        returns (Params memory params)
    {
        Obi.Data memory decoder = Obi.from(encodedParams);
        params.seed = decoder.decodeString();
        params.time = decoder.decodeU64();
        params.taskWorker = bytesToAddress(decoder.decodeBytes());

        require(decoder.finished(), "DATA_DECODE_NOT_FINISHED");
    }

    /// @notice Decodes the encoded data request response result
    /// @param encodedResult Encoded result data
    function decodeResult(bytes memory encodedResult)
        internal
        pure
        returns (Result memory result)
    {
        Obi.Data memory decoder = Obi.from(encodedResult);
        result.result = decoder.decodeBytes();
        result.proof = decoder.decodeBytes();
        require(decoder.finished(), "DATA_DECODE_NOT_FINISHED");
    }
}
