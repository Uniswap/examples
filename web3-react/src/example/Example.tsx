import React, { useCallback, useEffect, useState } from 'react'
import './Example.css'
import { Environment, CurrentConfig } from '../config'
import {
  connectBrowserExtensionWallet,
  getProvider,
  getWalletAddress,
} from '../libs/providers'
import {
  getHasCoinbaseExtensionInstalled,
  getHasMetaMaskExtensionInstalled,
  getIsInjected,
  coinbaseWalletConnection,
  injectedConnection,
} from '../libs/connectors'
import { Connector } from '@web3-react/types'

const useOnBlockUpdated = (callback: (blockNumber: number) => void) => {
  useEffect(() => {
    const subscription = getProvider()?.on('block', callback)
    return () => {
      subscription?.removeAllListeners()
    }
  })
}

const Example = () => {
  const [blockNumber, setBlockNumber] = useState<number>(0)

  // Listen for new blocks and update the wallet
  useOnBlockUpdated(async (blockNumber: number) => {
    refreshBalances()
    setBlockNumber(blockNumber)
  })

  // Update wallet state given a block number
  const refreshBalances = useCallback(async () => {
    const provider = getProvider()
    const address = getWalletAddress()
    if (!address || !provider) {
      return
    }
  }, [])

  // Event Handlers

  const onConnectWallet = useCallback(async () => {
    if (await connectBrowserExtensionWallet()) {
      refreshBalances()
    }
  }, [refreshBalances])

  function getOptions() {
    const isInjected = getIsInjected()
    const hasMetaMaskExtension = getHasMetaMaskExtensionInstalled()
    const hasCoinbaseExtension = getHasCoinbaseExtensionInstalled()
    const isMobile = false

    const isCoinbaseWalletBrowser = isMobile && hasCoinbaseExtension
    const isMetaMaskBrowser = isMobile && hasMetaMaskExtension
    const isInjectedMobileBrowser = isCoinbaseWalletBrowser || isMetaMaskBrowser

    let injectedOption
    if (!isInjected) {
      if (!isMobile) {
        injectedOption = (
          <button
            onClick={() => {
              tryActivation(injectedConnection.connector)
            }}>
            Install Metamask
          </button>
        )
      }
    } else if (!hasCoinbaseExtension) {
      if (hasMetaMaskExtension) {
        injectedOption = (
          <button
            onClick={() => {
              tryActivation(injectedConnection.connector)
            }}>
            Metamask
          </button>
        )
      } else {
        injectedOption = (
          <button
            onClick={() => {
              tryActivation(injectedConnection.connector)
            }}>
            Injected
          </button>
        )
      }
    }

    let coinbaseWalletOption
    if (isMobile && !isInjectedMobileBrowser) {
      coinbaseWalletOption = (
        <button
          onClick={() => {
            tryActivation(coinbaseWalletConnection.connector)
          }}>
          Install Coinbase
        </button>
      )
    } else if (!isMobile || isCoinbaseWalletBrowser) {
      coinbaseWalletOption = (
        <button
          onClick={() => {
            tryActivation(coinbaseWalletConnection.connector)
          }}>
          Connect Coinbase
        </button>
      )
    }

    return (
      <>
        {injectedOption}
        {coinbaseWalletOption}
      </>
    )
  }

  const tryActivation = useCallback(async (connector: Connector) => {
    try {
      await connector.activate()
    } catch (error) {
      console.debug(`web3-react connection error: ${error}`)
    }
  }, [])

  return (
    <div className="App">
      {CurrentConfig.rpc.mainnet === '' && (
        <h2 className="error">Please set your mainnet RPC URL in config.ts</h2>
      )}
      {CurrentConfig.env === Environment.WALLET_EXTENSION &&
        getProvider() === null && (
          <h2 className="error">
            Please install a wallet to use this example configuration
          </h2>
        )}
      <h3>{`Wallet Address: ${getWalletAddress()}`}</h3>
      {CurrentConfig.env === Environment.WALLET_EXTENSION &&
        !getWalletAddress() && (
          <button onClick={onConnectWallet}>Connect Wallet</button>
        )}
      <h3>{`Block Number: ${blockNumber + 1}`}</h3>
      <div className="connectors">{getOptions()}</div>
    </div>
  )
}

export default Example
