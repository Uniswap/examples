import { initializeConnector, Web3ReactHooks } from '@web3-react/core'
import { MetaMask } from '@web3-react/metamask'
import { Network } from '@web3-react/network'
import { Connector } from '@web3-react/types'
import { URL_MAP, DEFAULT_CHAIN_ID } from './constants'

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

function buildInjectedConnector() {
  let metaMaskErrorHandler: (error: Error) => void | undefined

  function onError(error: Error) {
    console.debug(`web3-react error: ${error}`)
  }

  function onMetamaskError(error: Error) {
    onError(error)
    metaMaskErrorHandler?.(error)
  }
  const [web3MetamaskWallet, web3MetamaskWalletHooks] =
    initializeConnector<MetaMask>(
      (actions) => new MetaMask({ actions, onError: onMetamaskError })
    )
  const injectedConnection: Connection = {
    connector: web3MetamaskWallet,
    hooks: web3MetamaskWalletHooks,
    type: ConnectionType.INJECTED,
  }

  return injectedConnection
}

function buildNetworkConnector() {
  const [web3Network, web3NetworkHooks] = initializeConnector<Network>(
    (actions) =>
      new Network({
        actions,
        urlMap: URL_MAP,
        defaultChainId: DEFAULT_CHAIN_ID,
      })
  )
  const networkConnection: Connection = {
    connector: web3Network,
    hooks: web3NetworkHooks,
    type: ConnectionType.NETWORK,
  }

  return networkConnection
}

export const PRIORITIZED_CONNECTORS: Connection[] = [
  buildInjectedConnector(),
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
      case ConnectionType.NETWORK:
        return PRIORITIZED_CONNECTORS[1]
    }
  }
}
