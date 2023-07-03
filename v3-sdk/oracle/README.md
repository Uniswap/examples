## Overview

This is an example of the Price Oracle observation functionality of a Uniswap V3 Pool

## Configuration

This application can be configured to interact with:

1. A locally deployed mainnet fork
2. The mainnet

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

### Start the web interface

Run `yarn start` and navigate to [http://localhost:3000/](http://localhost:3000/)
