# VRF Contracts

This repository contains the implementation of Band's VRF with Solidity.

![overview-2](https://user-images.githubusercontent.com/12705423/161716790-8696406a-af8d-422b-8ff4-5092cae4d0e1.png)

## Overview

VRF consists of multiple smart contracts and libraries working together. The figure below summarizes interaction between different smart contracts. Note that clear arrows represent inheritance relationship, while filled arrows represent `has-a-reference` relationship and filled dots represent `using` relationship. See comments at the top of the smart contracts' source codes for more details.

![band-overview](https://user-images.githubusercontent.com/12705423/127653518-2b4c43bd-0834-4b5e-903d-ce71db7ccf67.png)

## Contracts

#### Deployed contracts

| Contract Name   |      Address (testnet)     |
|----------|:-------------:|
| Bridge |  [0x6f057CE91CFcB59d839Db91e8DF067278a704cb8](https://testnet.explorer.emerald.oasis.dev/address/0x6f057CE91CFcB59d839Db91e8DF067278a704cb8/transactions) |
| VRF Provider |   [0xF1F3554b6f46D8f172c89836FBeD1ea8551eabad](https://testnet.explorer.emerald.oasis.dev/address/0xF1F3554b6f46D8f172c89836FBeD1ea8551eabad/transactions)   |
| Mock VRF Consumer | [0xE2f7Cf77DF70af8e92FF69B8Ffc92585C307a358](https://testnet.explorer.emerald.oasis.dev/address/0xE2f7Cf77DF70af8e92FF69B8Ffc92585C307a358/transactions) |

#### Libraries

- [Address](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/Address.sol) - A collection of functions related to the address type. In our case, only `isContract(address account)`(returns true if an account is a contract) function is used.

- [Obi](../obi/Obi.sol) - `Obi` is the standard way to serialized and deserialize binary data in the BandChain ecosystem. [👉 See doc](https://docs.bandchain.org/technical-specifications/obi.html)

- [VRFDecoder](./library/VRFDecoder.sol) - A wrapper of `Obi` in order to make it easier to use by `VRFProvider`.

- [Ownable](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol) - A contract module which provides a basic access control mechanism, where there is an account (an owner) that can be granted exclusive access to specific functions.

#### Interfaces

- [IBridge](./IBridge.sol) - An interface for interacting with `MockBridgeForVRF` contract which will be use by the `VRFProvider` contract.
- [IVRFProvider](./IVRFProvider.sol) - An interface for implementing `VRFProvider`.
- [IVRFConsumer](./IVRFConsumer.sol) - An interface for implementing

#### Bases

- [VRFProvider](./VRFProvider.sol) - An actual VRF provider contract that will be used by the actual random data consumer contract (this repo will use `MockVRFConsumer` to demonstrate contract interactions instead of the actual random data consumer contract).
- [VRFConsumerBase](./VRFConsumerBase.sol) - A basic contract for consumers who want to write extended contracts to suit their needs. `VRFConsumerBase` contain a reference of `VRFProvider` contract.

#### Mocks

**_Keep in mind that these mock contracts are for testing purposes and for easy visualization of the VRF system._**

- [MockBridgeForVRF](./MockBridgeForVRF.sol) - A mock contract of the actual Bridge ([👉 See actual Bridge](../bridge/Bridge.sol)).
- [MockVRFConsumer](./MockVRFConsumer.sol) - A mock contract that used as an example for an actual random data customer contract. The `MockVRFConsumer` is extended from `VRFConsumerBase`.

## Usage Flow

The figures below illustrates the interaction of each actor

**Steps**

1. The user requesting random data by calling `requestRandomDataFromProvider` function from the `MockVRFConsumer`.

![step1](https://user-images.githubusercontent.com/12705423/127733726-780b626c-b0c1-4c66-80bb-5923d3c10333.png)

2. The bounty hunter pick up an event emitted by the previous step. After that, the bounty hunter creates a request according to the event's params on Band's chain in order to retrieve the random data with proof from Band and then send it to the `VRFProvider` contract on Ethereum.

![step2](https://user-images.githubusercontent.com/12705423/127733734-5b0c79bc-4c09-43f8-9708-9d9075f3bbe6.png)


## Example results from testing

```shell
requestRandomData (Oasis)
https://testnet.explorer.emerald.oasis.dev/tx/0x4556e082494d6337b2d4d0bd0df24be8ce41bd97c9ca41a9717a60d25c59d24b/logs

request (Band)
https://laozi-testnet4.cosmoscan.io/request/4213063

relayProof (Oasis)
https://testnet.explorer.emerald.oasis.dev/tx/0xcb580f31662fe7a35e9f7d19880f38ce977737ac6c6f2a3eb01a84924a118d2a/logs
```
