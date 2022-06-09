# Javascript Example VRF Worker

The worker is a microservice that keep watching for `RandomDataRequested` events. 
After events are detected, the worker will request random data on Bandchain and then relay the result back to serve those requests.

## Installation

using node v16.15.0

run
```shell
node index.js
```

example output
```shell
{"fromBlock":32079525,"toBlock":32084025,"txMemoSize":0}
 Found packets:  [{"seed":"c2c3d5957bb51902731ff2637f2407c0701bdf1cd9f58c6cbf9a8b3a6da52817","time":1654760324,"key":"0xd167a66ea6a4b82f265df544951a35fffc768351f40bddb6c13147ba0ae624d5_2","blockNumber":32084025}]
requestID = 5034270
try  0  ...
try  1  ...
try  2  ...
try  3  ...
proof len 20480
relay success :  {"transactionHash":"0x06d606ddde4eef939319f596c63a933e3427426feb380626a1a7f8aeecda4bfc","status":true,"blockNumber":32084033}
{"fromBlock":32079536,"toBlock":32084036,"txMemoSize":1}
```
