import { Connector } from '@web3-react/types'
import { useEffect } from 'react'

import { ConnectionType, getConnection } from './connections'

export const useEagerlyConnect = () => {
  useEffect(() => {
    connect(getConnection(ConnectionType.NETWORK).connector)
    connect(getConnection(ConnectionType.GNOSIS_SAFE).connector)
  }, [])
}

async function connect(connector: Connector) {
  try {
    if (connector.connectEagerly) {
      await connector.connectEagerly()
    } else {
      await connector.activate()
    }
  } catch (error) {
    console.debug(`web3-react eager connection error: ${error}`)
  }
}
