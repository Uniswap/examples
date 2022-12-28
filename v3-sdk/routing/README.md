# Routing

## Overview

This is an example of finding an ideal swapping route that includes running against mainnet, locally, and using a wallet connection.

The core functionality of this example can be found in [`routing.ts`](./src/libs/routing.ts).

## Configuration

This application can be configured to interact with:

1. A locally deployed mainnet fork
2. The mainnet
3. An in-browser wallet (mainnet or configured locally)

To configure between these, set the `Environment` to the correct environment in the [example configuration](./src/config.ts) file.

The configuration includes control of the environment as well as inputs to the example's functionality. The rest of the code should need no modification to function.

## Setup

### Install dependencies

1. Run `yarn install` to install the project dependencies
2. Run `yarn install:chain` to download and install Foundry

### Get a mainnet RPC URL

1. Create an API key using any of the [Ethereum API providers](https://docs.ethers.io/v5/api/providers/) and grab the respective RPC URL, eg `https://mainnet.infura.io/v3/0ac57a06f2994538829c14745750d721`
2. Set that as the value of the `mainnet` `rpc` value inside the [config](./src/config.ts).

### Run your local chain

1. Run `yarn start:chain <provider_API_URL>` in a separate terminal session to start up a copy of the mainnet blockchain locally

### Select your wallet

This example uses the first sample wallet offered by Foundry (listed in the terminal output upon starting your local chain). If you'd like to use a different wallet, modify the [config](./src/config.ts)'s wallet `address` and `privateKey`. Note these are not used when configured to use a wallet extension.

### Setup a wallet browser extension

1. Install a wallet browser extension
2. Add a new manual/local network to your wallet local chain using `http://localhost:8545` for your RPC URL and `1337` for your chain ID, and `ETH` for your currency.
3. Import your selected wallet using your private key (e.g. `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` from Foundry's example wallets)

### Start the web interface

Run `yarn start` and navigate to [http://localhost:3000/](http://localhost:3000/)
