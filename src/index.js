import 'now-env'
import express from 'express'
import 'express-async-errors'
import bodyParser from 'body-parser'
import logger from 'morgan'
import path from 'path'
import chalk from 'chalk'
import errorHandler from 'errorhandler'

import https from 'https'
import fs from 'fs'
    
const stripe = require("stripe")(process.env.STRIPE_SERVER_KEY);

const app = express();

app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'html');
app.engine('html', require('hbs').__express);

app.use(logger('dev'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/', express.static(path.join(__dirname, '../static')));

app.disable('x-powered-by');

if (app.get('env') === 'development') {
    app.use(errorHandler());
} else {
    app.use((err, req, res, next) => {
        console.error(err);
        res.status(500).send('Server Error');
    });
}


import Web3 from 'web3'
import Tx from 'ethereumjs-tx'
import fetch from 'isomorphic-fetch'

var web3 = new Web3(
    new Web3.providers.HttpProvider('https://ropsten.infura.io/')
);

function sendRaw(rawTx) {
    return new Promise((resolve, reject) => {
        var privateKey = new Buffer(process.env.ETHEREUM_KEY, 'hex');
        var transaction = new Tx(rawTx);
        transaction.sign(privateKey);
        var serializedTx = '0x' + transaction.serialize().toString('hex');
        web3.eth.sendSignedTransaction(serializedTx).on('transactionHash', th => {
            resolve(th)
        })    
    })
}


async function sendToAddress(amount, recipientAddress){
    console.log(`Sending ${amount} wei to ${recipientAddress}`)
    return sendRaw({
        "from": process.env.ETHEREUM_ADDRESS, 
        "gasPrice": web3.utils.numberToHex(await web3.eth.getGasPrice()),
        "gasLimit": web3.utils.toHex(210000), // 21,000 is standard tx gas limit
        "to": recipientAddress,
        "value":  web3.utils.toHex(amount),
        "nonce": web3.utils.toHex(await web3.eth.getTransactionCount(
            process.env.ETHEREUM_ADDRESS, 'pending'))
    })
}


async function getETHUSDPrice(){
    let coinbasePriceResponse = await (await fetch('https://api.coinbase.com/v2/prices/ETH-USD/buy')).json()
    return coinbasePriceResponse.data.amount;
}




app.get('/widget', async (req, res) => {
    // TODO: validate that the address, amount, and other user inputs
    // are properly sanitized and escaped
    let ethPrice = await getETHUSDPrice();
    const usdAmount = req.query.amount;
    const ethAmount = usdAmount / ethPrice;

    res.render('widget', {
        title: 'wumbo',
        STRIPE_KEY: process.env.STRIPE_CLIENT_KEY,
        eth_address: req.query.address,
        eth_amount: ethAmount,
        usd_amount: req.query.amount,
        source: req.query.source || 'N/A'
    })
})


app.post('/charge', async (req, res) => {
    let ethPrice = await getETHUSDPrice();
    console.log(ethPrice);
    console.log(req.body)
    let amount = req.body.usd_amount;
    const ethAmount = amount / ethPrice;
    console.assert(amount < 25, 'Transaction can not be more than $25')
    console.assert(ethAmount < 1, 'ETH amount can not be more than 1 ETH')

    const charge = await stripe.charges.create({
        amount: amount * 100,
        currency: 'usd',
        description: 'ETH Smart Contract ' + req.body.source,
        source: req.body.token,
    });

    console.log(charge)
    const recipientAddress = req.body.address;

    let transactionHash = await sendToAddress(
        web3.utils.toWei(ethAmount.toString(), 'ether'), 
        recipientAddress)

    // console.log(result)

    res.end(JSON.stringify({
        transactionHash: transactionHash
    }))
})

app.set('host', process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0');
app.set('port', process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 7777);

function serverCallback(){
  console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env'));
  console.log('  Press CTRL-C to stop\n');
}

if(app.get('env') === 'development'){
    https.createServer({
      key: fs.readFileSync('server.key'),
      cert: fs.readFileSync('server.cert')
    }, app)
        .listen(app.get('port'), serverCallback);
}else{
    app.listen(app.get('port'), serverCallback);    
}