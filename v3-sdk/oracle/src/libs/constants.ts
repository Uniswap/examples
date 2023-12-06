// This file stores web3 related constants such as addresses, token definitions, ETH currency references and ABI's

import { Ether, ChainId, Token } from '@uniswap/sdk-core'

// Currencies and Tokens

export const ETH = Ether.onChain(ChainId.MAINNET)

export const WETH_TOKEN = new Token(
  ChainId.MAINNET,
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  18,
  'WETH',
  'Wrapped Ether'
)

export const USDC_TOKEN = new Token(
  ChainId.MAINNET,
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  6,
  'USDC',
  'USD//C'
)
