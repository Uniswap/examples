import { Web3ReactHooks } from '@web3-react/core'
import { Connector, AddEthereumChainParameter } from '@web3-react/types'
import { buildInjectedConnector } from './injected'
import { buildNetworkConnector } from './network'
import { buildCoinbaseWalletConnector } from './coinbase'
import { buildGnosisSafeConnector } from './gnosis'
import { buildWalletConnectConnector } from './wallet-connect'
import { CHAIN_INFO } from './constants'

export interface Connection {
  connector: Connector
  hooks: Web3ReactHooks
  type: ConnectionType
}

export enum ConnectionType {
  COINBASE_WALLET = 'COINBASE_WALLET',
  GNOSIS_SAFE = 'GNOSIS_SAFE',
  INJECTED = 'INJECTED',
  NETWORK = 'NETWORK',
  WALLET_CONNECT = 'WALLET_CONNECT',
}

export function getIsInjected(): boolean {
  return Boolean(window.ethereum)
}

export function getHasMetaMaskExtensionInstalled(): boolean {
  return window.ethereum?.isMetaMask ?? false
}

export function onConnectionError(error: Error) {
  console.debug(`web3-react error: ${error}`)
  console.log(`web3-react error: ${error}`)
}

export const PRIORITIZED_CONNECTORS: Connection[] = [
  buildInjectedConnector(),
  buildCoinbaseWalletConnector(),
  buildWalletConnectConnector(),
  buildGnosisSafeConnector(),
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
      case ConnectionType.WALLET_CONNECT:
        return PRIORITIZED_CONNECTORS[2]
      case ConnectionType.GNOSIS_SAFE:
        return PRIORITIZED_CONNECTORS[3]
      case ConnectionType.NETWORK:
        return PRIORITIZED_CONNECTORS[4]
    }
  }
}

export const switchNetwork = async (
  chainId: number,
  connectionType: ConnectionType | null
) => {
  if (!connectionType) {
    return
  }

  const { connector } = getConnection(connectionType)

  if (connectionType !== ConnectionType.NETWORK) {
    const chainInfo = CHAIN_INFO[chainId]
    const addChainParameter: AddEthereumChainParameter = {
      chainId,
      chainName: chainInfo.label,
      rpcUrls: [chainInfo.rpcUrl],
      nativeCurrency: chainInfo.nativeCurrency,
      blockExplorerUrls: [chainInfo.explorer],
    }
    await connector.activate(addChainParameter)
  }
}
