import { Web3ReactProvider } from '@web3-react/core'
import { Connector } from '@web3-react/types'
import React, { ReactNode, useEffect } from 'react'

import { ConnectionType, getConnection, PRIORITIZED_CONNECTORS } from '../connections'

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

export const Web3ContextProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    connect(getConnection(ConnectionType.NETWORK).connector)
    connect(getConnection(ConnectionType.GNOSIS_SAFE).connector)
  }, [])

  return (
    <Web3ReactProvider
      connectors={Object.values(PRIORITIZED_CONNECTORS).map((connector) => [connector.connector, connector.hooks])}
    >
      {children}
    </Web3ReactProvider>
  )
}
