import './index.css'

import { Buffer } from 'buffer'
import React from 'react'
import ReactDOM from 'react-dom/client'

import Example from './example/Example'
import { Web3ContextProvider } from './libs/components/Web3ContextProvider'

if (window.ethereum) {
  window.ethereum.autoRefreshOnNetworkChange = false
}

// Node polyfills required by WalletConnect are no longer bundled with webpack
window.Buffer = Buffer

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <React.StrictMode>
    <Web3ContextProvider>
      <Example />
    </Web3ContextProvider>
  </React.StrictMode>
)
