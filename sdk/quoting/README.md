# Chain

## Overview

This repository is a template for developing guides for dApps that interact with a locally deployed copy of the mainnet or the mainnet.
## Setup
This application can be configured to interact with:
1. A locally deployed mainnet fork
2. The mainnet

To configure between these two, set `CurrentEnvironment` to the correct environment in the [environment setup](./src/env.ts) file.

### Setup the chain

1. Create an API key using any of the [Ethereum API providers](https://docs.ethers.io/v5/api/providers/) and grab the respective RPC URL, eg `https://mainnet.infura.io/v3/0ac57a06f2994538829c14745750d721`
2. Set that as the value of `mainnetRpcUrl` inside the [environment setup](./src/env.ts) file for both environments.
3. **Skip if not running local copy of chain** - Run `yarn install:chain` to download and install Foundry
4. **Skip if not running local copy of chain** - Run `yarn start:chain <provider_API_URL>`

### Setup and run the App
1. Create a new terminal session
1. Grab the first public shown in the output and set it as the value for `address` the [environment setup](./src/env.ts) file - eg `0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266`
2. Grab the private key shown in the output and set it as the value for `privateKey` the [environment setup](./src/env.ts) file - eg `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
3. Run `yarn install` to install the project dependencies
4. Run `yarn start` and navigate to your [localhost](http://localhost:3000/)
5. Click on **Trade** and watch your currencies swap