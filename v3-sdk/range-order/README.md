# Creating a Range Order

## Overview

This is an example of minting a range-order position in a liquidity pool on a local fork of mainnet.

The core functionality of this example can be found in [`range-order`](./src/libs/range-order.ts).

## Usage

This example only works on a local fork of mainnet.

A wallet with 10,000 ETH is available to create Limit orders. On startup and execution of an order, the wallet wraps 1 ETH to get 1 WETH.
Clicking on Create Order creates a Take Profit order as close as possible to a target Price specified in the configuration.

A second wallet is available to simulate swaps by other market participants on the pool.
It also has 10,000 ETH available, half of which it sells for token1 on startup.
Clicking on buy or sell WETH buys or sells the amounts specified in the `config.ts` file on the pool where the Range Order is created.

To simulate listening for new blocks, the local chain is created with interval mining. This means transactions take some time to execute. The block time is therefore set to 6s.
The application needs 2-4 blocks to startup when a new local chain is created.
Transactions take 1 block to get included and the displayed values need another block to update as new read calls are made. Be aware that some functions include multiple transactions that are included sequentially.

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

1. Run `yarn start:chain` in a separate terminal session to start up a copy of the mainnet blockchain locally

### Setup your wallet

This example uses the first sample wallet offered by Foundry (listed in the terminal output upon starting your local chain). If you'd like to use a different wallet, modify the [config](./src/config.ts)'s wallet `address` and `privateKey`.
To simulate trades by other market participants and change the price of the Pool where the order is created, the second sample wallet by Foundry is used.

### Start the application

Run `yarn start:chain` to start the local chain the sample requires to work.
Run `yarn start` and navigate to [http://localhost:3000/](http://localhost:3000/).
