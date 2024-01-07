# Quoting

## Overview

This is an example of getting a quote using the Uniswap V3 guide and includes running against mainnet.

The core functionality of this example can be found in [`quote.ts`](./src/libs/quote.ts).

## Configuration

This application is a read only quoting application that communicates with the Ethereum mainnet. To configure the input token/amount and output token, edit the [configuration](./src/config.ts) file. The code should need no further modification to function.

## Setup

### Install dependencies

Run `yarn install` to install the project dependencies

### Get a mainnet RPC URL

1. Create an API key using any of the [Ethereum API providers](https://docs.ethers.io/v5/api/providers/) and grab the respective RPC URL, eg `https://mainnet.infura.io/v3/0ac57a06f2994538829c14745750d721`
2. Set that as the value of the `mainnet` `rpc` vale inside the [config](./src/config.ts).

### Start the web interface

Run `yarn start` and navigate to [http://localhost:3000/](http://localhost:3000/)
