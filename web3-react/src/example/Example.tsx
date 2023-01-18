import React, { useEffect, useState } from 'react'
import './Example.css'
import { CurrentConfig } from '../config'
import { ConnectionType, switchNetwork } from '../libs/connections'
import { useWeb3React } from '@web3-react/core'
import { ConnectionOptions } from '../libs/components/ConnectionOptions'
import { CHAIN_INFO } from '../libs/constants'

// Listen for new blocks and update the wallet
const useOnBlockUpdated = (callback: (blockNumber: number) => void) => {
  const { provider } = useWeb3React()
  useEffect(() => {
    if (!provider) {
      return
    }
    const subscription = provider.on('block', callback)
    return () => {
      subscription.removeAllListeners()
    }
  })
}

const Example = () => {
  const { chainId, account, isActive } = useWeb3React()
  const [blockNumber, setBlockNumber] = useState<number>(0)
  const [connectionType, setConnectionType] = useState<ConnectionType | null>(
    null
  )

  // Listen for new blocks and update the wallet
  useOnBlockUpdated(async (blockNumber: number) => {
    setBlockNumber(blockNumber)
  })

  return (
    <div className="App">
      {CurrentConfig.rpc.mainnet === '' && (
        <h2 className="error">Please set your mainnet RPC URL in config.ts</h2>
      )}
      <h3>{`Block Number: ${blockNumber + 1}`}</h3>
      <ConnectionOptions
        connectionType={connectionType}
        isActive={isActive}
        onActivate={setConnectionType}
        onDeactivate={setConnectionType}
      />
      <h3>{`ChainId: ${chainId}`}</h3>
      <h3>{`Connected Account: ${account}`}</h3>
      {Object.keys(CHAIN_INFO).map((chainId) => (
        <div key={chainId}>
          <button
            onClick={() => switchNetwork(parseInt(chainId), connectionType)}>
            {`Switch to ${CHAIN_INFO[chainId].label}`}
          </button>
        </div>
      ))}
    </div>
  )
}

export default Example
