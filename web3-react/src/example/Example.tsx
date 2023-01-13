import React, { useCallback, useEffect, useState } from 'react'
import './Example.css'
import { CurrentConfig } from '../config'
import { ConnectionType, getConnection } from '../libs/connections'
import { Connector } from '@web3-react/types'
import { useWeb3React } from '@web3-react/core'
import { ConnectionOptions } from '../libs/components/ConnectionOptions'

// Listen for new blocks and update the wallet
const useOnBlockUpdated = (callback: (blockNumber: number) => void) => {
  const { provider } = useWeb3React()
  useEffect(() => {
    if (!provider) {
      return
    }
    const subscription = provider?.on('block', callback)
    return () => {
      subscription?.removeAllListeners()
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

  // Try to activate a connector
  const tryActivateConnector = useCallback(async (connector: Connector) => {
    try {
      await connector.activate()
      const connectionType = getConnection(connector).type
      setConnectionType(connectionType)
    } catch (error) {
      console.debug(`web3-react connection error: ${error}`)
    }
  }, [])

  // Try to deactivate a connector
  const tryDeactivateConnector = useCallback(async (connector: Connector) => {
    try {
      if (connector && connector.deactivate) {
        connector.deactivate()
      }
      connector.resetState()
      setConnectionType(null)
    } catch (error) {
      console.debug(`web3-react disconnection error: ${error}`)
    }
  }, [])

  return (
    <div className="App">
      {CurrentConfig.rpc.mainnet === '' && (
        <h2 className="error">Please set your mainnet RPC URL in config.ts</h2>
      )}
      <h3>{`Block Number: ${blockNumber + 1}`}</h3>
      <ConnectionOptions
        connectionType={connectionType}
        isActive={isActive}
        onActivate={tryActivateConnector}
        onDeactivate={tryDeactivateConnector}
      />
      <h3>{`ChainId: ${chainId}`}</h3>
      <h3>{`Connected Account: ${account}`}</h3>
    </div>
  )
}

export default Example
