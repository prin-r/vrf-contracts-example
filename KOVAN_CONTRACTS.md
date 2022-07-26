# KOVAN CONTRACTS

| Contract Name   |      Address (kovan)     |
|----------|:-------------:|
| Bridge |  [0x2368545476456dDb7A56B5feC1A0EcF936ce2374](https://kovan.etherscan.io/address/0x2368545476456dDb7A56B5feC1A0EcF936ce2374#code) |
| Mock VRF Consumer | [0xE616E5Edf0e0a1a3E7096018EE8C5F1Ee7fE4F1e](https://kovan.etherscan.io/address/0xE616E5Edf0e0a1a3E7096018EE8C5F1Ee7fE4F1e#code) |
| VRF Consumer Reentrant |   [0x9D2af9cff155261FFAA9286a6CD59762d9E1016a](https://kovan.etherscan.io/address/0x9D2af9cff155261FFAA9286a6CD59762d9E1016a#code)   |
| Old VRF Provider v1 |   [0x70fd2c39eFFCc304fAa6cfb342A64173BAa46c6a](https://kovan.etherscan.io/address/0x70fd2c39eFFCc304fAa6cfb342A64173BAa46c6a#code)   |
| Old VRF Provider v2 |   [0x35Cfb8394469961D420DBCCbe08656fCDC1D52b5](https://kovan.etherscan.io/address/0x35Cfb8394469961D420DBCCbe08656fCDC1D52b5#code)   |
| VRF Provider |   [0x1479437467984f3892b54480e9cd3368b7eb04c6](https://kovan.etherscan.io/address/0x1479437467984f3892b54480e9cd3368b7eb04c6#code)   |

## Contracts Overview

VRF consists of multiple smart contracts and libraries working together. 
The figure below summarizes the relations between smart contracts. 

_relation types_
```text
⃤⃤   : represent “inheritance” relationship
♦  : represent “has-a-reference” relationship
⬤ : represent “using” relationship
```

![band-overview](https://user-images.githubusercontent.com/12705423/180752444-68e897f9-456c-4bce-a9d4-0d571f581ab9.jpg)


## Interaction Flow

The figures below illustrate the interaction of each actor, which are contracts on the client chain, off-chain service, and scripts on Bandchain.
The entire flow can be divided into three major steps.

**Steps**

1. The `VRFConsumer` requests a random data by calling `requestRandomDataFrom` function on the `VRFProvider`.
   - ![step1](https://user-images.githubusercontent.com/12705423/180965068-da9b7602-eadf-4d73-9631-fb039e7fdf43.png)
2. The worker(an off-chain service) pick up an event that was emitted by the `VRFProvider` in step 1. After that, the worker creates a request transaction according to the event's params on Band's chain.
   - ![step2.0](https://user-images.githubusercontent.com/12705423/180965314-9972845c-4a57-427f-95c5-c9d1e9924706.png)
   - After requesting data on Band, the validators will gather the result from sources and then aggregate them on-chain to produce the final result with its proof of validity.
   - ![step2.1](https://user-images.githubusercontent.com/12705423/180965394-fff61430-298b-4a90-81b0-78e8036c23ac.png)
3. The worker collects the proof and relays it by calling a function `relayProof` on the `VRFProvider` contract, which will make a callback to the `VRFConsumer` to deliver the final result.
   - ![step4](https://user-images.githubusercontent.com/12705423/180965502-bd00366a-6c2b-46bc-a531-562a9e42c5a7.png)

## Example on the kovan and laozi-testnet4

1. The **[VRFConsumer]("https://kovan.etherscan.io/address/0xe616e5edf0e0a1a3e7096018ee8c5f1ee7fe4f1e")** requests a random number from the **[VRFProvider]("https://kovan.etherscan.io/address/0x1479437467984f3892b54480e9cd3368b7eb04c6")** by sending the **[transaction]("https://kovan.etherscan.io/tx/0x38934dc39edf75dfa057c327251c8e75b4f07d48bfa4f8c1ad58b5726130e89b")**.
2. An off-chain service will pick up an emitted event and then make a **[request]("https://laozi-testnet4.cosmoscan.io/request/5474088")** on Bandchain.
3. After the request is resolved on the Bandchain, the off-chain service will collect the proof of validity and send a relay **[transaction](https://kovan.etherscan.io/tx/0x71555a0506c41c9d8d5196e3bb7467aa60dabdb16d296f44e73d0492229e4ad7)** to resolve the task on Kovan.

## Example testcases on the testnet

- Reentrant Transactions
  - [Request data from consumer success](https://kovan.etherscan.io/tx/0xe03f89f4b3eab2ade6bbc2f940debfc778607987caa6f0de5a6f63013b04ecf6)
  - [Request on Bandchain](https://laozi-testnet4.cosmoscan.io/request/4937760)
  - [Save Proof](https://kovan.etherscan.io/tx/0xa33ed2394504fc0ae3d856992fc104d4dc5cb740554321c345a16f7ebd91bc2e)
  - [Relay random data and drain ETH success](https://kovan.etherscan.io/tx/0x17a41b8fec564e53f2bb0e308b102ea6965338c30a8db4e10e4a6c53ca358f2e)
- Fail transactions
  - [Task fee is lower than the minimum fee](https://kovan.etherscan.io/tx/0x7b0778922e42844b645d8f94363ca2eec2f7a600b52a0812383eb70e0e96b476)
  - [Seed already existed for this sender](https://kovan.etherscan.io/tx/0xa2d324ecd9d4dc877bb0b956dff37c51184b0a2fc3e72628e1bd2d8ac8e707f9)
  - [Request data from consumer success](https://kovan.etherscan.io/tx/0x7e2ed8f10a87a80f9c3f386d4b25714f14e42753bb43bb9ab8384796e4029657)
  - [Request on Bandchain](https://laozi-testnet4.cosmoscan.io/request/4966119)
  - [The sender must be the task worker](https://kovan.etherscan.io/tx/0xefe54ba2f10300b1c20094b6f974429f98e6ed1b9d1fc4fa908b4e0cbef71c6c)
  - [Trying to re-entrance ➜ ReentrancyGuard: reentrant call](https://kovan.etherscan.io/tx/0x11d0bf550d9e189ce490e9339d0bfaedad0050b7a18fac52171860b920d52569)
- Success transaction 
  - [Relay random data success](https://kovan.etherscan.io/tx/0x27e92776f85f7a47102d9d5c7a4b162d7657e1d1613a7a0b7acdecfaedf5a638)
  

