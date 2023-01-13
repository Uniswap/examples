import { Web3ReactHooks } from '@web3-react/core'
import { Connector } from '@web3-react/types'
import { buildInjectedConnector } from './injected'
import { buildNetworkConnector } from './network'
import { buildCoinbaseWalletConnector } from './coinbase'

export interface Connection {
  connector: Connector
  hooks: Web3ReactHooks
  type: ConnectionType
}

export enum ConnectionType {
  COINBASE_WALLET = 'COINBASE_WALLET',
  INJECTED = 'INJECTED',
  NETWORK = 'NETWORK',
}

export function getIsInjected(): boolean {
  return Boolean(window.ethereum)
}

export function getHasMetaMaskExtensionInstalled(): boolean {
  return window.ethereum?.isMetaMask ?? false
}

export function onConnectionError(error: Error) {
  console.debug(`web3-react error: ${error}`)
}

export const PRIORITIZED_CONNECTORS: Connection[] = [
  buildInjectedConnector(),
  buildCoinbaseWalletConnector(),
  buildNetworkConnector(),
]

export function getConnection(c: Connector | ConnectionType) {
  if (c instanceof Connector) {
    const connection = PRIORITIZED_CONNECTORS.find(
      (connection) => connection.connector === c
    )
    if (!connection) {
      throw Error('unsupported connector')
    }
    return connection
  } else {
    switch (c) {
      case ConnectionType.INJECTED:
        return PRIORITIZED_CONNECTORS[0]
      case ConnectionType.COINBASE_WALLET:
        return PRIORITIZED_CONNECTORS[1]
      case ConnectionType.NETWORK:
        return PRIORITIZED_CONNECTORS[2]
    }
  }
}
