/* eslint-disable @typescript-eslint/no-unused-vars */
import { ETH_TOKEN, USDC_TOKEN } from './libs/currency'
import { Currency } from '@uniswap/sdk-core'

// Types

// Sets if the example should run locally or on chain
export enum ChainEnvironment {
  LOCAL,
  PRODUCTION,
}

// Inputs that configure this example to run
export interface ExampleConfig {
  env: ChainEnvironment
  rpc: {
    local: string
    mainnet: string
  }
  wallet: {
    address: string
    privateKey: string
  }
  currencies: {
    tokenIn: Currency
    amountIn: number
    tokenOut: Currency
  }
}

// Configurations

// Shared information between both configuration environments
const BaseConfig = {
  rpc: {
    local: 'http://localhost:8545',
    mainnet: 'https://mainnet.infura.io/v3/7b37a3c5c10b47c18473128c2e3bd155',
  },
  wallet: {
    address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  },
  currencies: {
    tokenIn: ETH_TOKEN,
    amountIn: 1,
    tokenOut: USDC_TOKEN,
  },
}

const LocalConfig: ExampleConfig = {
  env: ChainEnvironment.LOCAL,
  ...BaseConfig,
}

const ProdConfig: ExampleConfig = {
  env: ChainEnvironment.PRODUCTION,
  ...BaseConfig,
}

export const CurrentConfig = LocalConfig
