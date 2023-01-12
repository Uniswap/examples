import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import Example from './example/Example'
import Web3Provider from './libs/components/Web3Provider'

if (window.ethereum) {
  window.ethereum.autoRefreshOnNetworkChange = false
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <React.StrictMode>
    <Web3Provider>
      <Example />
    </Web3Provider>
  </React.StrictMode>
)
