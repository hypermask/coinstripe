import Web3 from 'web3'
import Tx from 'ethereumjs-tx'
import fetch from 'isomorphic-fetch'
import 'now-env'

var web3 = new Web3(
    new Web3.providers.HttpProvider('https://ropsten.infura.io/')
);

async function sendRaw(rawTx) {
    var privateKey = new Buffer(process.env.ETHEREUM_KEY, 'hex');
    var transaction = new Tx(rawTx);
    transaction.sign(privateKey);
    var serializedTx = '0x' + transaction.serialize().toString('hex');
    return await web3.eth.sendSignedTransaction(serializedTx)
}


async function sendToAddress(amount, recipientAddress){
    console.log(`Sending ${amount} wei to ${recipientAddress}`)
    return await sendRaw({
        "from": process.env.ETHEREUM_ADDRESS, 
        "gasPrice": await getGasPrice(),
        "gasLimit": web3.utils.toHex(210000), // 21,000 is standard tx gas limit
        "to": recipientAddress,
        "value":  web3.utils.toHex(amount),
        "nonce": web3.utils.toHex(await web3.eth.getTransactionCount(
            process.env.ETHEREUM_ADDRESS, 'pending'))
    })
}

async function getGasPrice(){
    // let chainId = await web3.eth.net.getId()
    // if(chainId === '1'){
    //     // on mainnet try to save money by using the gas prices from ethgas station
    //     let gasInfo = await fetch(
    //         "https://ethgasstation.info/json/ethgasAPI.json"
    //     );
    //     let gasInfoJson = await gasInfo.json();
    //     return web3.utils.toWei(
    //         gasInfoJson.safeLow.toString(),
    //         "gwei"
    //     )        
    // }
    return web3.utils.numberToHex(await web3.eth.getGasPrice())
}


async function getETHUSDPrice(){
    let coinbasePriceResponse = await (await fetch('https://api.coinbase.com/v2/prices/ETH-USD/buy')).json()
    
    // should we increase price by 1% to cope with volatility?
    // let ethUSDPrice = coinbasePriceResponse.data.amount * PRICE_VOLATILITY_BUFFER; 
    // return ethUSDPrice

    return coinbasePriceResponse.data.amount;
}


export default async (req, res) => {
    res.end(JSON.stringify(await getETHUSDPrice()))
    // res.end(JSON.stringify(
    //     await sendToAddress(100, '0x8B4867203bb8e2e742E8C4Bed883faE5099C3665'), null, 4))
}