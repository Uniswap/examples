import React, { ReactNode } from 'react'
import { Web3ReactProvider, Web3ReactHooks } from '@web3-react/core'
import { Connector } from '@web3-react/types'
import { metamaskConnection, networkConnection } from '../connectors'

const connectors: [Connector, Web3ReactHooks][] = [
  [metamaskConnection.connector, metamaskConnection.hooks],
  [networkConnection.connector, networkConnection.hooks],
]

export default function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <>
      <Web3ReactProvider connectors={connectors}>{children}</Web3ReactProvider>
    </>
  )
}
