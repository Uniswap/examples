# web3-react

## Overview

This is an example of using the Uniswap `web3-react` package and includes running against mainnet and other L2s.

## Configuration

To configure the available chains, and pick an initial chain, edit the [configuration](./src/config.ts) file. The code should need no further modification to function.

## Setup

### Install dependencies

1. Run `yarn install` to install the project dependencies

### Get a mainnet RPC URL

1. Create an API key using any of the [Ethereum API providers](https://docs.ethers.io/v5/api/providers/) and grab the respective RPC URL, eg `https://mainnet.infura.io/v3/0ac57a06f2994538829c14745750d721`
2. Set that as the value of the `mainnet` `rpc` vale inside the [config](./src/config.ts).

### Start the web interface

Run `yarn start` and navigate to [http://localhost:3000/](http://localhost:3000/)
