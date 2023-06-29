import { Token } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { USDT_TOKEN, WETH_TOKEN } from './libs/constants'

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
    token0: Token
    token0Amount: number
    token1: Token
    token1Amount: number
    poolFee: FeeAmount
  }
  targetPercentageUp: number
  mockMarketMakerWallet: {
    address: string
    privateKey: string
  }
  mockMarketMakerPool: {
    buyAmount: number
    sellAmount: number
    token0: Token
    token1: Token
    poolFee: FeeAmount
  }
}

// Example Configuration

export const CurrentConfig: ExampleConfig = {
  env: Environment.LOCAL,
  rpc: {
    local: 'http://localhost:8545',
    mainnet: 'https://mainnet.infura.io/v3/0ac57a06f2994538829c14745750d721',
  },
  wallet: {
    address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
    privateKey:
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  },
  tokens: {
    token0: WETH_TOKEN,
    token0Amount: 1,
    token1: USDT_TOKEN,
    token1Amount: 0,
    poolFee: FeeAmount.HIGH,
  },
  targetPercentageUp: 5,
  mockMarketMakerWallet: {
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    privateKey:
      '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  },
  mockMarketMakerPool: {
    buyAmount: 250,
    sellAmount: 250,
    token0: WETH_TOKEN,
    token1: USDT_TOKEN,
    poolFee: FeeAmount.LOW,
  },
}
