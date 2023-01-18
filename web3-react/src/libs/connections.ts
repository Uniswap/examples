import { Web3ReactHooks } from '@web3-react/core'
import { AddEthereumChainParameter, Connector } from '@web3-react/types'

import { buildCoinbaseWalletConnector } from './coinbase'
import { CHAIN_INFO } from './constants'
import { buildGnosisSafeConnector } from './gnosis'
import { buildInjectedConnector } from './injected'
import { buildNetworkConnector } from './network'
import { buildWalletConnectConnector } from './wallet-connect'

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

export function getHasMetaMaskExtensionInstalled(): boolean {
  return window.ethereum?.isMetaMask ?? false
}

export function onConnectionError(error: Error) {
  console.debug(`web3-react error: ${error}`)
}

export const PRIORITIZED_CONNECTORS: { [key in ConnectionType]: Connection } = {
  [ConnectionType.INJECTED]: buildInjectedConnector(),
  [ConnectionType.COINBASE_WALLET]: buildCoinbaseWalletConnector(),
  [ConnectionType.WALLET_CONNECT]: buildWalletConnectConnector(),
  [ConnectionType.GNOSIS_SAFE]: buildGnosisSafeConnector(),
  [ConnectionType.NETWORK]: buildNetworkConnector(),
}

export function getConnection(c: Connector | ConnectionType) {
  if (c instanceof Connector) {
    const connection = Object.values(PRIORITIZED_CONNECTORS).find((connection) => connection.connector === c)
    if (!connection) {
      throw Error('unsupported Connector')
    }
    return connection
  } else {
    switch (c) {
      case ConnectionType.INJECTED:
        return PRIORITIZED_CONNECTORS[ConnectionType.INJECTED]
      case ConnectionType.COINBASE_WALLET:
        return PRIORITIZED_CONNECTORS[ConnectionType.COINBASE_WALLET]
      case ConnectionType.WALLET_CONNECT:
        return PRIORITIZED_CONNECTORS[ConnectionType.WALLET_CONNECT]
      case ConnectionType.GNOSIS_SAFE:
        return PRIORITIZED_CONNECTORS[ConnectionType.GNOSIS_SAFE]
      case ConnectionType.NETWORK:
        return PRIORITIZED_CONNECTORS[ConnectionType.NETWORK]
    }
  }
}

export const switchNetwork = async (chainId: number, connectionType: ConnectionType | null) => {
  if (!connectionType) {
    return
  }

  const { connector } = getConnection(connectionType)

  if (connectionType === ConnectionType.WALLET_CONNECT || connectionType === ConnectionType.NETWORK) {
    await connector.activate(chainId)
    return
  }

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

// Try to activate a connector
export const tryActivateConnector = async (connector: Connector): Promise<ConnectionType | undefined> => {
  try {
    await connector.activate()
    const connectionType = getConnection(connector).type
    return connectionType
  } catch (error) {
    console.debug(`web3-react connection error: ${error}`)
  }
}

// Try to deactivate a connector
export const tryDeactivateConnector = async (connector: Connector): Promise<null | undefined> => {
  try {
    if (connector && connector.deactivate) {
      connector.deactivate()
    }
    connector.resetState()
    return null
  } catch (error) {
    console.debug(`web3-react disconnection error: ${error}`)
  }
}
