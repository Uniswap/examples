import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import Example from './example/Example'
import { Web3ReactProvider, Web3ReactHooks } from '@web3-react/core'
import { Connector } from '@web3-react/types'
import {
  coinbaseWalletConnection,
  injectedConnection,
  networkConnection,
} from './libs/connectors'

if (window.ethereum) {
  window.ethereum.autoRefreshOnNetworkChange = false
}

const connectors: [Connector, Web3ReactHooks][] = [
  [injectedConnection.connector, injectedConnection.hooks],
  [coinbaseWalletConnection.connector, coinbaseWalletConnection.hooks],
  [networkConnection.connector, networkConnection.hooks],
]

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <React.StrictMode>
    <Web3ReactProvider connectors={connectors}>
      <Example />
    </Web3ReactProvider>
  </React.StrictMode>
)
