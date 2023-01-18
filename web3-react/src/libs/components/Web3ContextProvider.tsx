import { Web3ReactProvider } from '@web3-react/core'
import React, { ReactNode } from 'react'

import { PRIORITIZED_CONNECTORS } from '../connections'
import { useEagerlyConnect } from '../hooks'

export const Web3ContextProvider = ({ children }: { children: ReactNode }) => {
  useEagerlyConnect()

  return (
    <Web3ReactProvider
      connectors={Object.values(PRIORITIZED_CONNECTORS).map((connector) => [connector.connector, connector.hooks])}
    >
      {children}
    </Web3ReactProvider>
  )
}
