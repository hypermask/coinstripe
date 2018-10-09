# CoinStripe

CoinStripe is a simple debit card to ETH API powered by Stripe. 

# Installation

This is a simple Node.JS application. The easiest way to deploy this is probably through ZEIT Now. 

First we need to create a hot wallet private key & public key. This can be done from [MyEtherWallet](https://www.myetherwallet.com/)

    now secrets add ethereum-address YOUR_ETH_ADDRESS_HERE
    now secrets add ethereum-key YOUR_ETH_PRIVATE_KEY_HERE

Then we need to add in the client key and server keys for stripe

    now secrets add stripe-client-key YOUR_STRIPE_CLIENT_KEY
    now secrets add stripe-server-key YOUR_STIRPE_CLIENT_KEY

To deploy the application, just type

    now
