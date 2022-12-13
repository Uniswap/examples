// This file stores token references for easy named usage in action contexts

import { SupportedChainId, Token } from '@uniswap/sdk-core'

export const USDC_TOKEN = new Token(
  SupportedChainId.MAINNET,
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  6,
  'USDC',
  'USD//C'
)
