import React, { ReactNode } from 'react'
import { Web3ReactProvider } from '@web3-react/core'
import { connectors } from '../constants'
import { useEagerlyConnect } from '../hooks'

export const Web3Provider = ({ children }: { children: ReactNode }) => {
  useEagerlyConnect()

  return (
    <Web3ReactProvider
      connectors={connectors.map((connector) => [
        connector.connector,
        connector.hooks,
      ])}>
      {children}
    </Web3ReactProvider>
  )
}
