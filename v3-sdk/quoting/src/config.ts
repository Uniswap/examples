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
    amountIn: string
    out: Token
    poolFee: number
  }
}

// Example Configuration

export const CurrentConfig: ExampleConfig = {
  rpc: {
    local: 'http://localhost:8545',
    mainnet:
      'https://mainnet.chainnodes.org/f8df1ee3-8aaa-471e-bc3b-b3d18af3bd3c',
  },
  tokens: {
    in: USDC_TOKEN,
    amountIn: '1000',
    out: WETH_TOKEN,
    poolFee: FeeAmount.MEDIUM,
  },
}
