import React, { useCallback, useEffect, useState } from 'react'
import './Example.css'
import { Environment, CurrentConfig } from '../config'
import { getCurrencyBalance, wrapETH } from '../libs/wallet'
import {
  connectBrowserExtensionWallet,
  getProvider,
  getWalletAddress,
  TransactionState,
} from '../libs/providers'
import { Token, TradeType } from '@uniswap/sdk-core'
import { Pool, Trade } from '@uniswap/v3-sdk'
import {
  executeTrade,
  getBestTradeExactIn,
  initializePools,
} from '../libs/simulate'
import { displayTrade } from '../libs/conversion'

const useOnBlockUpdated = (callback: (blockNumber: number) => void) => {
  useEffect(() => {
    const subscription = getProvider()?.on('block', callback)
    return () => {
      subscription?.removeAllListeners()
    }
  })
}

const Example = () => {
  const [trade, setTrade] = useState<Trade<Token, Token, TradeType>>()

  const [pools, setPools] = useState<Pool[]>()

  const [tokenInBalance, setTokenInBalance] = useState<string>()
  const [tokenOutBalance, setTokenOutBalance] = useState<string>()
  const [txState, setTxState] = useState<TransactionState>(TransactionState.New)
  const [blockNumber, setBlockNumber] = useState<number>(0)

  const [fetching, setFetching] = useState<boolean>()

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

    setTokenInBalance(
      await getCurrencyBalance(provider, address, CurrentConfig.tokens.in)
    )
    setTokenOutBalance(
      await getCurrencyBalance(provider, address, CurrentConfig.tokens.out)
    )
  }, [])

  // Event Handlers

  const onConnectWallet = useCallback(async () => {
    if (await connectBrowserExtensionWallet()) {
      refreshBalances()
    }
  }, [refreshBalances])

  const onInitializePools = useCallback(async () => {
    setFetching(true)
    setPools(await initializePools())
    setFetching(false)
  }, [])

  const onCreateTrade = useCallback(async () => {
    refreshBalances()
    const bestTrade = await getBestTradeExactIn(pools)
    setTrade(bestTrade)
  }, [refreshBalances, pools])

  const onTrade = useCallback(
    async (trade: Trade<Token, Token, TradeType> | undefined) => {
      if (trade) {
        setTxState(await executeTrade(trade))
      }
    },
    []
  )

  return (
    <div className="App">
      {CurrentConfig.rpc.mainnet === '' &&
        CurrentConfig.env === Environment.MAINNET && (
          <h2 className="error">
            Please set your mainnet RPC URL in config.ts
          </h2>
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
      <h3>{`Transaction State: ${txState}`}</h3>
      <h3>{`Token In (${CurrentConfig.tokens.in.symbol}) Balance: ${tokenInBalance}`}</h3>
      <h3>{`Token Out (${CurrentConfig.tokens.out.symbol}) Balance: ${tokenOutBalance}`}</h3>
      <button onClick={() => wrapETH(100)} disabled={getProvider() === null}>
        <p>Wrap ETH</p>
      </button>
      {pools === undefined && <h3>{`Initialize Pools to simulate trade`}</h3>}
      {pools !== undefined && <h3>{`Pools initialized successfully`}</h3>}
      {!fetching && (
        <button onClick={onInitializePools} disabled={getProvider() === null}>
          <p>Initialize Pools</p>
        </button>
      )}
      {fetching && <h3>Fetching...</h3>}
      <button onClick={onCreateTrade} disabled={pools === undefined}>
        <p>Create Trade offchain</p>
      </button>

      <h3>{trade && `Constructed Trade: ${displayTrade(trade)}`}</h3>
      <button
        onClick={() => onTrade(trade)}
        disabled={
          trade === undefined ||
          txState === TransactionState.Sending ||
          getProvider() === null
        }>
        <p>Trade</p>
      </button>
    </div>
  )
}

export default Example
