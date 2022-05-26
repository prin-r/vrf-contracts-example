const Web3 = require("web3");
const { v4: uuidv4 } = require('uuid');
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

const mockConsumerContract = process.env.CONSUMER;
const vrfProvider = process.env.VRF_PROVIDER;
const oracleScriptID = 152;
const web3 = new Web3(process.env.EVM_RPC);
const bandClient = new Client(process.env.BAND_RPC);
const privateKey = PrivateKey.fromMnemonic(process.env.BAND_MNEMONIC);
const pubkey = privateKey.toPubkey();
const sender = pubkey.toAddress().toAccBech32();

// a utility function for pausing the main loop
const sleep = async (ms) => new Promise((r) => setTimeout(r, ms));

const requestRandomData = async () => {
    try {
        // create new seed
        const exampleSeed = uuidv4();
        console.log("seed: ", exampleSeed);

        // create raw tx
        const signed = await web3.eth.accounts.signTransaction(
          {
            to: mockConsumerContract,
            data: web3.eth.abi.encodeFunctionCall(
              {
                name: "requestRandomDataFromProvider",
                type: "function",
                inputs: [
                  {
                    type: "string",
                    name: "seed",
                  },
                ],
              },
              [exampleSeed]
            ),
            value: 0,
            gas: process.env.GAS_LIMIT_REQUEST,
            // gasPrice: process.env.GAS_PRICE,
          },
          process.env.EXAMPLE_PK
        );

        // send tx
        const receipt = await web3.eth.sendSignedTransaction(
          signed.rawTransaction
        );

        console.log("REQUEST_RANDOM_DATA_TX: ", receipt);

        return receipt;
    } catch (e) {
        console.log(e);
    }
};

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

  const obi = new Obi('{seed:string,time:u64}/{proof:[u8],result:[u8]}');
  const calldata = obi.encodeInput({seed, time: Number(time)});

  const requestMessage = new Message.MsgRequestData(
    oracleScriptID,
    calldata,
    1,
    1,
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
            // gasPrice: process.env.GAS_PRICE,
          },
          process.env.EXAMPLE_PK
        );

        // send tx
        const receipt = await web3.eth.sendSignedTransaction(
          signed.rawTransaction
        );

        console.log("RELAY_TX: ", receipt);

        return receipt;
    } catch (e) {
        console.log(e);
    }
};

// steps
(async () => {
    console.log("1. get random data");
    const r = await requestRandomData();
    result = null;

    console.log("2. extract log");
    for (const {address, data} of r["logs"]) {
        if (address.toLowerCase() === vrfProvider) {
            result = decodeEventLog(data);
            break;
        }
    }

    console.log("3. get proof");
    const proof = await sendRequestToBand(result["seed"], result["time"]);

    console.log("4. relay proof to the vrf provider");
    await relayProof(proof);
})();



