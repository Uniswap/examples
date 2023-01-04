import { Token } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { USDC_TOKEN, DAI_TOKEN } from './libs/constants'

// Sets if the example should run locally or on chain
export enum Environment {
  LOCAL,
  MAINNET,
  WALLET_EXTENSION,
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
    amountIn: number
    out: Token
    poolFee: number
  }
}

// Example Configuration

export const CurrentConfig: ExampleConfig = {
  env: Environment.MAINNET,
  rpc: {
    local: 'http://localhost:8545',
    mainnet: 'https://mainnet.gateway.tenderly.co/biusNZqSR6tj1wxGGykHD',
  },
  wallet: {
    address: '0xe471474c7E72FBEe60024a16f2265B4AAeb56e0A',
    privateKey:
      '0x4fb16d1363c8370529c6f38173cfc338545df7f976d586adf8563a8b76937d29',
  },
  tokens: {
    in: DAI_TOKEN,
    amountIn: 1000000000000000000,
    out: USDC_TOKEN,
    poolFee: FeeAmount.LOWEST,
  },
}
