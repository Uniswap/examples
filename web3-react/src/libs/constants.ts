import { initializeConnector, Web3ReactHooks } from '@web3-react/core'
import { MetaMask } from '@web3-react/metamask'
import { Network } from '@web3-react/network'
import { Connector } from '@web3-react/types'
import { CurrentConfig, Environment } from '../config'
import { JsonRpcProvider } from '@ethersproject/providers'

const LOCAL_CHAIN_ID = 1337
const MAINNET_CHAIN_ID = 1
const DEFAULT_CHAIN_ID =
  CurrentConfig.env === Environment.LOCAL ? LOCAL_CHAIN_ID : MAINNET_CHAIN_ID

const URL_MAP = {
  [LOCAL_CHAIN_ID]: new JsonRpcProvider(CurrentConfig.rpc.local),
  [MAINNET_CHAIN_ID]: new JsonRpcProvider(CurrentConfig.rpc.mainnet),
}

export const METAMASK_URL = 'https://metamask.io/'

export interface Connection {
  connector: Connector
  hooks: Web3ReactHooks
  type: ConnectionType
}

export enum ConnectionType {
  INJECTED = 'INJECTED',
  NETWORK = 'NETWORK',
}

export function getIsInjected(): boolean {
  return Boolean(window.ethereum)
}

export function getHasMetaMaskExtensionInstalled(): boolean {
  return window.ethereum?.isMetaMask ?? false
}

export function getHasCoinbaseExtensionInstalled(): boolean {
  return window.ethereum?.isCoinbaseWallet ?? false
}

let metaMaskErrorHandler: (error: Error) => void | undefined

export function setMetMaskErrorHandler(errorHandler: (error: Error) => void) {
  metaMaskErrorHandler = errorHandler
}

function onError(error: Error) {
  console.debug(`web3-react error: ${error}`)
}

function onMetamaskError(error: Error) {
  onError(error)
  metaMaskErrorHandler?.(error)
}

const [web3Network, web3NetworkHooks] = initializeConnector<Network>(
  (actions) =>
    new Network({
      actions,
      urlMap: URL_MAP,
      defaultChainId: DEFAULT_CHAIN_ID,
    })
)
export const networkConnection: Connection = {
  connector: web3Network,
  hooks: web3NetworkHooks,
  type: ConnectionType.NETWORK,
}

const [web3MetamaskWallet, web3MetamaskWalletHooks] =
  initializeConnector<MetaMask>(
    (actions) => new MetaMask({ actions, onError: onMetamaskError })
  )
export const injectedConnection: Connection = {
  connector: web3MetamaskWallet,
  hooks: web3MetamaskWalletHooks,
  type: ConnectionType.INJECTED,
}

export const connectors: Connection[] = [injectedConnection, networkConnection]

export function getConnection(c: Connector | ConnectionType) {
  if (c instanceof Connector) {
    const connection = connectors.find(
      (connection) => connection.connector === c
    )
    if (!connection) {
      throw Error('unsupported connector')
    }
    return connection
  } else {
    switch (c) {
      case ConnectionType.INJECTED:
        return injectedConnection
      case ConnectionType.NETWORK:
        return networkConnection
    }
  }
}
