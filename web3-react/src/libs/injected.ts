import { initializeConnector } from '@web3-react/core'
import { MetaMask } from '@web3-react/metamask'

import { Connection, ConnectionType, onConnectionError } from './connections'

export function buildInjectedConnector() {
  const [web3MetamaskWallet, web3MetamaskWalletHooks] = initializeConnector<MetaMask>(
    (actions) => new MetaMask({ actions, onError: onConnectionError })
  )
  const injectedConnection: Connection = {
    connector: web3MetamaskWallet,
    hooks: web3MetamaskWalletHooks,
    type: ConnectionType.INJECTED,
  }

  return injectedConnection
}
