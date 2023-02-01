# web3-react

## Overview

This is an example of using the Uniswap `web3-react` package and includes running against mainnet and other L2s.

## Configuration

To configure the available chains, and pick an initial chain, edit the [configuration](./src/config.ts) file. The code should need no further modification to function.

## Setup

### Install dependencies

1. Run `yarn install` to install the project dependencies

### Get a mainnet RPC URL

1. Create an API key using any of the [Ethereum API providers](https://docs.ethers.io/v5/api/providers/) and grab the respective RPC URL, or use the default `https://mainnet.infura.io/v3/4bf032f2d38a4ed6bb975b80d6340847`
2. Set that as the value of the `rpc` inside the [config](./src/config.ts) for the chains you decide to connect the dApp to.

### Start the web interface

Run `yarn start` and navigate to [http://localhost:3000/](http://localhost:3000/)
