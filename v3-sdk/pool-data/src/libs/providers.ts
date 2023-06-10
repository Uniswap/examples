import { ethers } from 'ethers'
import { CurrentConfig } from '../config'
import { BaseProvider } from '@ethersproject/providers'

// Single copies of provider and wallet
const mainnetProvider = new ethers.providers.JsonRpcProvider(
  CurrentConfig.rpc.mainnet
)

// Provider  Functions

export function getMainnetProvider(): BaseProvider {
  return mainnetProvider
}
