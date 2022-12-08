# Routing

## Wallet

This example introduces the concept of **smart order-routing** and is meant to be used alongside the guides on Uniswap [docs](https://docs.uniswap.org/).
## Setup
The setup involves 2 steps:
1. Setup and run your local copy of the mainnet with Foundry
2. Setup and run the dApp with Create React App

### Setup and run your local copy of the mainnet

1. Create an API key using any of the [Ethereum API providers](https://docs.ethers.io/v5/api/providers/) and grab the respective API URL
2. Run `yarn install:chain` to download and install Foundry
3. Close the current terminal session and create a new one
4. Run `yarn start:chain --fork-url <provider_API_URL>`

### Setup and run the dApp
1. Install a wallet browser extension
2. Configure the browser extension to connect to your local copy of the mainnet and change the chaindId to 1
3. Import a new account to your wallet using a private key that Foundry output - eg `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
4. Run `yarn install` to install the project dependencies
5. Run `yarn start` and navigate to your [localhost](http://localhost:3000/)
6. Click on **Trade** and watch your currencies swap