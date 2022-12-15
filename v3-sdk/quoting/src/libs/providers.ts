import { ethers, providers } from 'ethers'
import { Environment, CurrentConfig } from '../config'

// Provider Functions

export function getProvider(): providers.Provider {
  return new ethers.providers.JsonRpcProvider(
    CurrentConfig.env === Environment.PRODUCTION
      ? CurrentConfig.rpc.mainnet
      : CurrentConfig.rpc.local
  )
}
