## Overview

This is an example of using multicalls to fetch all tick data of a Uniswap V3 Pool.
This example is not meant to be run in a browser but should instead serve as an example on how to prepare offchain calculations on Pools.

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

### Run the script

Run `yarn start` and inspect the data returned in your console.
