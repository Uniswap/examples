# Quoting V2

## Overview

This is an example of getting a quote using the Uniswap V3 **Quote V2** and includes running against mainnet or a locally deployed chain.

The core functionality of this example can be found in [`quote-v2.ts`](./src/libs/quote-v2.ts).

## Configuration

This application is a read only quoting application and can be configured to interact with:

1. A locally deployed mainnet fork
2. The mainnet

To configure local or mainnet, the input token/amount and output token, edit the [configuration](./src/config.ts) file. The code should need no further modification to function.

Runs in Ethereum by defaul, you can use a diffent networks adapting the [PoolFactory and QuoterV2 addressess](./src/libs/constants.ts) as explained [here](https://docs.uniswap.org/contracts/v3/reference/deployments/).

### Get a mainnet RPC URL

1. Create aun API key using any of the [Ethereum API providers](https://docs.ethers.io/v5/api/providers/) and grab the respective RPC URL, eg `https://mainnet.infura.io/v3/0ac57a06f2994538829c14745750d721`
2. Set that as the value of the `mainnet` `rpc` vale inside the [config](./src/config.ts).

## Setup

### Install dependencies

1. Run `yarn install` to install the project dependencies
2. Run `yarn install:chain` to download and install Foundry

### Start the web interface

Run `yarn start` and navigate to [http://localhost:3000/](http://localhost:3000/)
