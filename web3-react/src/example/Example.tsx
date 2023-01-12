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
import { Web3Provider } from '@ethersproject/providers'

const useOnBlockUpdated = (
  provider: Web3Provider | undefined,
  callback: (blockNumber: number) => void
) => {
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
  const { chainId, account, provider } = useWeb3React()
  const [blockNumber, setBlockNumber] = useState<number>(0)

  // Listen for new blocks and update the wallet
  useOnBlockUpdated(provider, async (blockNumber: number) => {
    setBlockNumber(blockNumber)
  })

  function getOptions() {
    const isInjected = getIsInjected()
    const hasMetaMaskExtension = getHasMetaMaskExtensionInstalled()
    const hasCoinbaseExtension = getHasCoinbaseExtensionInstalled()
    const isMobile = false

    let injectedOption
    if (!isInjected) {
      if (!isMobile) {
        injectedOption = <a href='"https://metamask.io/"'>Install Metamask</a>
      }
    } else if (!hasCoinbaseExtension) {
      if (hasMetaMaskExtension) {
        injectedOption = (
          <div>
            <button
              onClick={() => {
                tryActivation(metamaskConnection.connector)
              }}>
              Connect Metamask
            </button>
            <button
              onClick={() => {
                tryDeactivation(metamaskConnection.connector)
              }}>
              Disconnect Metamask
            </button>
          </div>
        )
      } else {
        injectedOption = (
          <div>
            <button
              onClick={() => {
                tryActivation(metamaskConnection.connector)
              }}>
              Connect Injected
            </button>
            <button
              onClick={() => {
                tryDeactivation(metamaskConnection.connector)
              }}>
              Disconnect Injected
            </button>
          </div>
        )
      }
    }

    return <>{injectedOption}</>
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
      console.debug(`web3-react connection error: ${error}`)
    }
  }, [])

  return (
    <div className="App">
      {CurrentConfig.rpc.mainnet === '' && (
        <h2 className="error">Please set your mainnet RPC URL in config.ts</h2>
      )}
      <h3>{`Block Number: ${blockNumber + 1}`}</h3>
      <div className="connectors">{getOptions()}</div>
      <h3>{`ChainId: ${chainId}`}</h3>
      <h3>{`Connected Account: ${account}`}</h3>
    </div>
  )
}

export default Example
