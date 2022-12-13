import { Token } from '@uniswap/sdk-core'

export interface Environment {
  tokenIn: Token
  tokenOut: Token
  tokenInAmount: number
  tokenOutAmount?: number
  address: string
  privateKey: string
  isLocal: boolean
  localRpcUrl: string
  mainnetRpcUrl: string
}
