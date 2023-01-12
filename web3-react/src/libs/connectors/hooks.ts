import { useEffect } from 'react'
import { networkConnection } from './constants'
import { Connector } from '@web3-react/types'

export const useEagerlyConnect = () => {
  useEffect(() => {
    connect(networkConnection.connector)
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
