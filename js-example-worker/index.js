const Web3 = require("web3");
const axios = require('axios');
const {
  Client,
  Wallet: { PrivateKey },
  Message,
  Coin,
  Transaction,
  Fee,
  Obi,
} = require("@bandprotocol/bandchain.js");

require("dotenv").config();

const startBlock = process.env.START_BLOCK;
const vrfProvider = process.env.VRF_PROVIDER;
const oracleScriptID = 152;
const web3 = new Web3(process.env.EVM_RPC);
const workerAddress = [...Buffer.from(
    web3.eth.accounts.privateKeyToAccount(process.env.EXAMPLE_PK)["address"].slice(2), "hex"
)];
const bandClient = new Client(process.env.BAND_RPC);
const privateKey = PrivateKey.fromMnemonic(process.env.BAND_MNEMONIC);
const pubkey = privateKey.toPubkey();
const sender = pubkey.toAddress().toAccBech32();

const decodeEventLog = data => {
    return { ...web3.eth.abi.decodeLog(
        [{
            type: 'uint256',
            name: 'nonce'
        },{
            type: 'address',
            name: 'caller',
        },{
            type: 'string',
            name: 'clientSeed',
        },{
            type: 'string',
            name: 'seed',
        },{
            type: 'uint64',
            name: 'time',
        },{
            type: 'bytes32',
            name: 'blockHash',
        },{
            type: 'uint256',
            name: 'bounty',
        }],
        data
    )};
}

const sendRequestToBand = async (seed, time) => {
  let coin = new Coin();
  coin.setDenom("uband");
  coin.setAmount("10");

  const obi = new Obi('{seed:string,time:u64,worker_address:[u8]}/{proof:[u8],result:[u8]}');
  const calldata = obi.encodeInput({seed, time: Number(time), worker_address: workerAddress});

  const requestMessage = new Message.MsgRequestData(
    oracleScriptID,
    calldata,
    4,
    3,
    "band",
    sender,
    [coin],
    30000,
    50000
  );

  // Construct a transaction
  const fee = new Fee()
  fee.setAmountList([coin])
  fee.setGasLimit(400000)
  const chainId = await bandClient.getChainId()
  const txn = new Transaction()
  txn.withMessages(requestMessage)
  await txn.withSender(bandClient, sender)
  txn.withChainId(chainId)
  txn.withFee(fee)
  txn.withMemo('from vrf example')

  // Sign the transaction using the private key
  const signDoc = await txn.getSignDoc(pubkey);
  const signature = privateKey.sign(signDoc);
  const txRawBytes = txn.getTxData(signature, pubkey);

  // Broadcast the transaction
  const sendTx = await bandClient.sendTxBlockMode(txRawBytes);
  const requestID = sendTx["logsList"][0]["eventsList"]
    .find((x) => x["type"] === "request")
    ["attributesList"].find((x) => x["key"] === "id")["value"];

  console.log("requestID =", requestID);

  let proof = "";
  let count = 0
  while (true) {
    try {
      const res = await axios.get(process.env.BAND_PROOF_ENDPOINT + requestID);
      if (res["data"]["result"]["evm_proof_bytes"].length > 0) {
        proof = res["data"]["result"]["evm_proof_bytes"];
        break;
      }
    } catch (e) {
      // pass
      console.log("try ", count++, " ...");
    }
    await sleep(3000);
  }

  console.log("proof len", proof.length);

  return proof;
};

const relayProof = async proof => {
    try {
        // create raw tx
        const signed = await web3.eth.accounts.signTransaction(
          {
            to: vrfProvider,
            data: web3.eth.abi.encodeFunctionCall(
              {
                name: "relayProof",
                type: "function",
                inputs: [
                  {
                    type: "bytes",
                    name: "proof",
                  },
                ],
              },
              ["0x" + proof]
            ),
            value: 0,
            gas: process.env.GAS_LIMIT_RELAY,
            gasPrice: await web3.eth.getGasPrice(),
          },
          process.env.EXAMPLE_PK
        );

        // send tx
        const receipt = await web3.eth.sendSignedTransaction(
          signed.rawTransaction
        );

        const {transactionHash, status, blockNumber} = receipt;
        if (status === true) {
            console.log("relay success : ", JSON.stringify({transactionHash, status, blockNumber}));
        } else {
            throw "Error: relay fail" + JSON.stringify({transactionHash, status, blockNumber});
        }
    } catch (e) {
        console.log(e);
    }
};

// subscribe new event
const handleLogs = async (fromBlock, toBlock) => {
    try {
        const logs = await web3.eth.getPastLogs({
            fromBlock,
            toBlock,
            address: vrfProvider,
            topics: ["0x5f30a3a0b726e5cbdd8256126dd37ad1055382cb4880fa7f6c03391987f91688"],
        });

        return logs.map( ({transactionHash, logIndex, blockNumber, data}) =>  {
            const params = web3.eth.abi.decodeParameters([
                "uint256",
                "address",
                "string",
                "string",
                "uint64",
                "bytes32",
                "uint256"
            ], data);

            return {
                seed: params["3"],
                time: Number(params["4"]),
                key: transactionHash + "_" + logIndex,
                blockNumber: Number(blockNumber)
            };
        });
    } catch (e) {
        console.log(e)
        return null;
    }
}

const logReplaceLine = text => {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(text);
}

// a utility function for pausing the main loop
const sleep = async (ms) => new Promise((r) => setTimeout(r, ms));

// steps
(async () => {
    let fromBlock = Number(startBlock);
    const txMemo = {
        "0xd167a66ea6a4b82f265df544951a35fffc768351f40bddb6c13147ba0ae624d5_2": 32084025
    };
    while (true) {
        try {
            const ceilingBlockNumber = Number((await web3.eth.getBlock('latest'))["number"]) - 1;
            const toBlock = Math.min(ceilingBlockNumber, fromBlock + 4500);
            fromBlock = toBlock - 4500;

            logReplaceLine(JSON.stringify({fromBlock, toBlock, txMemoSize: Object.keys(txMemo).length }));

            const packets = (await handleLogs(fromBlock, toBlock)).filter(p => {
                if (txMemo[p["key"]]) {
                    return false;
                }
                return true;
            });

            if (packets.length > 0) {
                console.log("\n Found packets: ", JSON.stringify(packets));

                for (const {seed, time, key, blockNumber} of packets) {
                    const proof = await sendRequestToBand(seed, time);
                    await relayProof(proof);

                    await sleep(1000);

                    txMemo[key] = blockNumber;
                }
            }

            // remove outdated key
            for (const key in txMemo) {
                if (txMemo[key] < fromBlock) {
                    delete txMemo[key];
                    console.log("\n key pruned: ", key);
                }
            }

            fromBlock += 4500;
            await sleep(3000);
        } catch (e) {
            console.log("\n mainloop error: ", e);
        }
    }
})();
