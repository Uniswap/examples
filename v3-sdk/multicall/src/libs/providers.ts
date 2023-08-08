import { ethers, providers } from 'ethers'
import { Environment, CurrentConfig } from '../config.js'

// Single copies of provider
const mainnetProvider = new ethers.providers.JsonRpcProvider(
  CurrentConfig.rpc.mainnet
)

const localProvider = new ethers.providers.JsonRpcProvider(
  CurrentConfig.rpc.local
)

// Provider Functions

export function getProvider(): providers.Provider {
  return CurrentConfig.env === Environment.LOCAL
    ? localProvider
    : mainnetProvider
}
