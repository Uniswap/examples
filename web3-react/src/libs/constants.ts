import { CurrentConfig, Environment } from '../config'
import { JsonRpcProvider } from '@ethersproject/providers'

// Chains
const LOCAL_CHAIN_ID = 1337
const MAINNET_CHAIN_ID = 1
export const INPUT_CHAIN_ID =
  CurrentConfig.env === Environment.LOCAL ? LOCAL_CHAIN_ID : MAINNET_CHAIN_ID
export const INPUT_CHAIN_URL =
  CurrentConfig.env === Environment.LOCAL
    ? CurrentConfig.rpc.local
    : CurrentConfig.rpc.mainnet

export const CHAIN_TO_PROVIDER_MAP = {
  [LOCAL_CHAIN_ID]: new JsonRpcProvider(CurrentConfig.rpc.local),
  [MAINNET_CHAIN_ID]: new JsonRpcProvider(CurrentConfig.rpc.mainnet),
}

// URLs
export const METAMASK_URL = 'https://metamask.io/'
