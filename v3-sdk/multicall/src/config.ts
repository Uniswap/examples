import { Token } from '@uniswap/sdk-core'
import { WETH_TOKEN, USDC_TOKEN } from './libs/constants.js'
import { FeeAmount } from '@uniswap/v3-sdk'

// Sets if the example should run locally or on chain
export enum Environment {
  LOCAL,
  MAINNET,
}

// Inputs that configure this example to run
export interface ExampleConfig {
  env: Environment
  rpc: {
    local: string
    mainnet: string
  }
  pool: {
    token0: Token
    token1: Token
    fee: FeeAmount
  }
}

// Example Configuration

export const CurrentConfig: ExampleConfig = {
  env: Environment.MAINNET,
  rpc: {
    local: 'http://localhost:8545',
    mainnet: 'https://mainnet.infura.io/v3/0ac57a06f2994538829c14745750d721',
  },
  pool: {
    token0: USDC_TOKEN,
    token1: WETH_TOKEN,
    fee: FeeAmount.MEDIUM,
  },
}
