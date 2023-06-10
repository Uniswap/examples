import { WETH9, Token } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { WBTC_TOKEN } from './libs/constants'

// Sets if the example should run locally or on chain
export enum Environment {
  MAINNET,
}

// Inputs that configure this example to run
export interface ExampleConfig {
  env: Environment
  rpc: {
    mainnet: string
  }
  pool: {
    tokenA: Token
    tokenB: Token
    fee: FeeAmount
  }
  chart: {
    numSurroundingTicks: number
  }
}

// Example Configuration

export const CurrentConfig: ExampleConfig = {
  env: Environment.MAINNET,
  rpc: {
    mainnet: 'https://mainnet.infura.io/v3/0ac57a06f2994538829c14745750d721',
  },
  pool: {
    tokenA: WBTC_TOKEN,
    tokenB: WETH9[1],
    fee: FeeAmount.MEDIUM,
  },
  chart: {
    numSurroundingTicks: 100,
  },
}
