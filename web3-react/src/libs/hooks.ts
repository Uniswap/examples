import { useEffect } from 'react'
import { getConnection, ConnectionType } from './connections'
import { Connector } from '@web3-react/types'

export const useEagerlyConnect = () => {
  useEffect(() => {
    connect(getConnection(ConnectionType.NETWORK).connector)
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
