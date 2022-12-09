# Wallet

## Overview

This repository is a template for developing guides for dApps that interact with a locally deployed copy of the mainnet or the mainnet using a Web3 wallet.
## Setup

This dApp can be configured to interact with:
1. A locally deployed mainnet fork
2. The mainnet

To configure between these two, set `CurrentEnvironment` to the correct environment in the [environment setup](./src/env.ts) file.

### Setup the chain

1. Create an API key using any of the [Ethereum API providers](https://docs.ethers.io/v5/api/providers/) and grab the respective RPC URL, eg `https://mainnet.infura.io/v3/0ac57a06f2994538829c14745750d721`
2. Set that as the value of `mainnetRpcUrl` inside the [environment setup](./src/env.ts) file for both environments.
3. **Skip if not running local copy of chain** - Run `yarn install:chain` to download and install Foundry
4. **Skip if not running local copy of chain** - Run `yarn start:chain <provider_API_URL>`

### Setup and run the dApp
1. Install a wallet browser extension
2. Configure the browser extension to connect to your local copy of the mainnet and change the chainId to 1
3. Import a new account to your wallet using a private key that Foundry output - eg `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
4. Run `yarn install` to install the project dependencies
5. Run `yarn start` and navigate to your [localhost](http://localhost:3000/)
6. Click on **Trade** and watch your currencies swap

## Experimenting
Take a look at the [environment setup](./src/env.ts) file, play around with the inputs and observe the outputs change.