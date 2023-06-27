# Creating a Range Order

## Overview

This is an example of minting a range-order position in a liquidity pool on a local fork of mainnet.

The core functionality of this example can be found in [`range-order`](./src/libs/range-order.ts).

## Configuration

This application can be configured to interact with a locally deployed mainnet fork.

The [configuration](./src/config.ts) includes control of the environment as well as inputs to the example's functionality. The rest of the code should need no modification to function.

## Setup

### Install dependencies

1. Run `yarn install` to install the project dependencies
2. Run `yarn install:chain` to download and install Foundry

### Get a mainnet RPC URL

1. Create an API key using any of the [Ethereum API providers](https://docs.ethers.io/v5/api/providers/) and grab the respective RPC URL, eg `https://mainnet.infura.io/v3/0ac57a06f2994538829c14745750d721`
2. Set that as the value of the `mainnet` `rpc` value inside the [config](./src/config.ts).

### Run your local chain

1. Run `yarn start:chain <provider_API_URL>` in a separate terminal session to start up a copy of the mainnet blockchain locally

### Setup your wallet

This example uses the first sample wallet offered by Foundry (listed in the terminal output upon starting your local chain). If you'd like to use a different wallet, modify the [config](./src/config.ts)'s wallet `address` and `privateKey`.
To simulate trades by other market participants and change the price of the Pool where the order is created, the second sample wallet by Foundry is used.

### Start the application

Run `yarn start:chain` to start the local chain the sample requires to work.
Run `yarn start` and navigate to [http://localhost:3000/](http://localhost:3000/).
