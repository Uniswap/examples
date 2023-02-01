import { initializeConnector } from '@web3-react/core'
import { Network } from '@web3-react/network'

import { Connection, ConnectionType } from './connections'
import { CHAIN_TO_URL_MAP, INPUT_CHAIN_ID } from './constants'

export function buildNetworkConnector() {
  const [web3Network, web3NetworkHooks] = initializeConnector<Network>(
    (actions) =>
      new Network({
        actions,
        urlMap: CHAIN_TO_URL_MAP,
        defaultChainId: INPUT_CHAIN_ID,
      })
  )
  const networkConnection: Connection = {
    connector: web3Network,
    hooks: web3NetworkHooks,
    type: ConnectionType.NETWORK,
  }

  return networkConnection
}
