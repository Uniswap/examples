import { Token } from '@uniswap/sdk-core'
import {
  DAI_TOKEN,
  WETH_TOKEN,
  USDT_WETH_Pool,
  USDC_DAI_Pool,
  USDC_USDT_Pool,
  PoolIdentifier,
} from './libs/constants'

// Sets if the example should run locally or on chain
export enum Environment {
  LOCAL,
  WALLET_EXTENSION,
  MAINNET,
}

// Inputs that configure this example to run
export interface ExampleConfig {
  env: Environment
  rpc: {
    local: string
    mainnet: string
  }
  wallet: {
    address: string
    privateKey: string
  }
  tokens: {
    in: Token
    readableAmountIn: number
    out: Token
  }
  pools: PoolIdentifier[]
}

// Example Configuration

export const CurrentConfig: ExampleConfig = {
  env: Environment.LOCAL,
  rpc: {
    local: 'http://localhost:8545',
    mainnet: '',
  },
  wallet: {
    address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
    privateKey:
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  },
  tokens: {
    in: WETH_TOKEN,
    readableAmountIn: 1,
    out: DAI_TOKEN,
  },
  pools: [USDT_WETH_Pool, USDC_USDT_Pool, USDC_DAI_Pool],
}
