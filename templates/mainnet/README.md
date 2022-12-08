# Mainnet

## Overview

This example introduces the concept of **smart order-routing** and is meant to be used alongside the guides on Uniswap [docs](https://docs.uniswap.org/).
## Setup
The setup involves 2 steps:
1. Setup and run your local copy of the mainnet with Foundry
2. Setup and run the dApp with Create React App

### Setup and run your local copy of the mainnet

1. Create an API key using any of the [Ethereum API providers](https://docs.ethers.io/v5/api/providers/) and grab the respective API URL
2. Run `yarn install:chain` to download and install Foundry
3. Close the current terminal session and create a new one
4. Run `yarn start:chain --fork-url <provider_API_URL>`

### Setup and run the dApp
1. Create a new terminal session
1. Grab the first public shown in the output and set it as the value for `MY_ADDRESS` in [App.tsx](./src/App.tsx) - eg `0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266`
2. Grab the private key shown in the output and set it as the value for `MY_PRIVATE_KEY` in [App.tsx](./src/App.tsx) - eg `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
3. Run `yarn install` to install the project dependencies
4. Run `yarn start` and navigate to your [localhost](http://localhost:3000/)
5. Click on **Trade** and watch your currencies swap