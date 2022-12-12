import { Environment } from './types'
import { Ether, SupportedChainId, Token } from '@uniswap/sdk-core'
import { ethers } from 'ethers'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const LocalEnvironment: Environment = {
  currencyIn: Ether.onChain(SupportedChainId.MAINNET),
  currencyInAmount: ethers.utils.parseEther('1').toString(),
  currencyOut: new Token(SupportedChainId.MAINNET, '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 6, 'USDC', 'USD//C'),
  address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  isLocal: true,
  localRpcUrl: 'http://localhost:8545',
  mainnetRpcUrl: 'https://mainnet.infura.io/v3/0ac57a06f2994538829c14745750d721',
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ProdEnvironment: Environment = {
  currencyIn: Ether.onChain(SupportedChainId.MAINNET),
  currencyInAmount: ethers.utils.parseEther('1').toString(),
  currencyOut: new Token(SupportedChainId.MAINNET, '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 6, 'USDC', 'USD//C'),
  address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  isLocal: false,
  localRpcUrl: 'http://localhost:8545',
  mainnetRpcUrl: 'https://mainnet.infura.io/v3/0ac57a06f2994538829c14745750d721',
}

export const CurrentEnvironment = LocalEnvironment
