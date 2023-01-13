import { initializeConnector } from '@web3-react/core'
import { Network } from '@web3-react/network'
import { URL_MAP, DEFAULT_CHAIN_ID } from './constants'
import { Connection, ConnectionType } from './connections'

export function buildNetworkConnector() {
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
