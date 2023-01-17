import { Token } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { USDC_TOKEN, WETH_TOKEN } from './libs/constants'

// Inputs that configure this example to run
export interface ExampleConfig {
  rpc: {
    local: string
    mainnet: string
  }
  tokens: {
    in: Token
    amountIn: number
    out: Token
    poolFee: number
  }
}

// Example Configuration

export const CurrentConfig: ExampleConfig = {
  rpc: {
    local: 'http://localhost:8545',
    mainnet: 'https://mainnet.infura.io/v3/0ac57a06f2994538829c14745750d721',
  },
  tokens: {
    in: USDC_TOKEN,
    amountIn: 3100,
    out: WETH_TOKEN,
    poolFee: FeeAmount.MEDIUM,
  },
}
