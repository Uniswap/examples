import { Environment } from './types'
import { SupportedChainId, Token } from '@uniswap/sdk-core'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const LocalEnvironment: Environment = {
  tokenOut: new Token(
    SupportedChainId.MAINNET,
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    18,
    'WETH',
    'Wrapped Ether'
  ),
  tokenInAmount: 1400 / Math.pow(10, 6),
  tokenIn: new Token(SupportedChainId.MAINNET, '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 6, 'USDC', 'USD//C'),
  address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  isLocal: true,
  localRpcUrl: 'http://localhost:8545',
  mainnetRpcUrl: 'https://mainnet.infura.io/v3/0ac57a06f2994538829c14745750d721',
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ProdEnvironment: Environment = {
  tokenIn: new Token(SupportedChainId.MAINNET, '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 6, 'USDC', 'USD//C'),
  tokenInAmount: 1400 * Math.pow(10, 6),
  tokenOut: new Token(
    SupportedChainId.MAINNET,
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    18,
    'WETH',
    'Wrapped Ether'
  ),
  address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  isLocal: false,
  localRpcUrl: 'http://localhost:8545',
  mainnetRpcUrl: 'https://mainnet.infura.io/v3/0ac57a06f2994538829c14745750d721',
}

export const CurrentEnvironment = ProdEnvironment
