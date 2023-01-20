import { initializeConnector } from '@web3-react/core'
import { WalletConnect } from '@web3-react/walletconnect'

import { Connection, ConnectionType, onConnectionError } from './connections'
import { CHAIN_TO_URL_MAP } from './constants'

export function buildWalletConnectConnector() {
  const [web3WalletConnect, web3WalletConnectHooks] = initializeConnector<WalletConnect>(
    (actions) =>
      new WalletConnect({
        actions,
        options: {
          rpc: CHAIN_TO_URL_MAP,
          qrcode: true,
        },
        onError: onConnectionError,
      })
  )
  const walletConnectConnection: Connection = {
    connector: web3WalletConnect,
    hooks: web3WalletConnectHooks,
    type: ConnectionType.WALLET_CONNECT,
  }
  return walletConnectConnection
}
