import React, { useCallback, useEffect, useState } from 'react'
import './Example.css'
import { CurrentConfig } from '../config'
import {
  getHasCoinbaseExtensionInstalled,
  getHasMetaMaskExtensionInstalled,
  getIsInjected,
  metamaskConnection,
} from '../libs/connectors'
import { Connector } from '@web3-react/types'
import { useWeb3React } from '@web3-react/core'

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

  // Listen for new blocks and update the wallet
  useOnBlockUpdated(async (blockNumber: number) => {
    setBlockNumber(blockNumber)
  })

  function getOptions(isActive: boolean) {
    const isInjected = getIsInjected()
    const hasMetaMaskExtension = getHasMetaMaskExtensionInstalled()
    const hasCoinbaseExtension = getHasCoinbaseExtensionInstalled()
    const isMobile = false

    let meteMaskOption
    if (!isInjected) {
      if (!isMobile) {
        meteMaskOption = <a href='"https://metamask.io/"'>Install Metamask</a>
      }
    } else if (!hasCoinbaseExtension) {
      if (hasMetaMaskExtension) {
        meteMaskOption = (
          <div>
            {!isActive ? (
              <button
                onClick={() => {
                  tryActivation(metamaskConnection.connector)
                }}>
                Connect Metamask
              </button>
            ) : (
              <button
                onClick={() => {
                  tryDeactivation(metamaskConnection.connector)
                }}>
                Disconnect Metamask
              </button>
            )}
          </div>
        )
      }
    }

    return <>{meteMaskOption}</>
  }

  const tryActivation = useCallback(async (connector: Connector) => {
    try {
      await connector.activate()
    } catch (error) {
      console.debug(`web3-react connection error: ${error}`)
    }
  }, [])

  const tryDeactivation = useCallback(async (connector: Connector) => {
    try {
      if (connector && connector.deactivate) {
        connector.deactivate()
      }
      connector.resetState()
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
      <div className="connectors">{getOptions(isActive)}</div>
      <h3>{`ChainId: ${chainId}`}</h3>
      <h3>{`Connected Account: ${account}`}</h3>
    </div>
  )
}

export default Example
