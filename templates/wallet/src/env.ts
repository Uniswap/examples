import { Environment } from './types'
import { Ether, SupportedChainId, Token } from '@uniswap/sdk-core'
import { ethers } from 'ethers'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const LocalEnvironment: Environment = {
  currencyIn: Ether.onChain(SupportedChainId.MAINNET),
  currencyInAmount: ethers.utils.parseEther('1').toString(),
  currencyOut: new Token(SupportedChainId.MAINNET, '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 6, 'USDC', 'USD//C'),
  mainnetRpcUrl: 'https://mainnet.infura.io/v3/0ac57a06f2994538829c14745750d721',
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ProdEnvironment: Environment = {
  currencyIn: Ether.onChain(SupportedChainId.MAINNET),
  currencyInAmount: ethers.utils.parseEther('1').toString(),
  currencyOut: new Token(SupportedChainId.MAINNET, '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 6, 'USDC', 'USD//C'),
  mainnetRpcUrl: 'https://mainnet.infura.io/v3/0ac57a06f2994538829c14745750d721',
}

export const CurrentEnvironment = LocalEnvironment
