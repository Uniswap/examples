import React, { useCallback, useEffect, useMemo, useState } from 'react'
import './Example.css'
import { Environment, CurrentConfig } from '../config'
import { getCurrencyBalance } from '../libs/balance'
import { getPositions, mintPosition } from '../libs/positions'
import {
  connectBrowserExtensionWallet,
  getProvider,
  TransactionState,
  getWalletAddress,
} from '../libs/providers'
import { Position } from '@uniswap/v3-sdk'

const useOnBlockUpdated = (callback: (blockNumber: number) => void) => {
  useEffect(() => {
    const subscription = getProvider()?.on('block', callback)
    return () => {
      subscription?.removeAllListeners()
    }
  })
}

const Example = () => {
  const [token0Balance, setToken0Balance] = useState<string>()
  const [token1Balance, setToken1Balance] = useState<string>()
  const [positions, setPositions] = useState<Position[]>([])
  const [txState, setTxState] = useState<TransactionState>(TransactionState.New)
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
    if (!provider || !address) {
      return
    }

    // Set Balances
    setToken0Balance(
      await getCurrencyBalance(provider, address, CurrentConfig.tokens.token0)
    )
    setToken1Balance(
      await getCurrencyBalance(provider, address, CurrentConfig.tokens.token1)
    )

    // Set Positions
    setPositions(await getPositions())
  }, [])

  // Event Handlers

  const onConnectWallet = useCallback(async () => {
    if (await connectBrowserExtensionWallet()) {
      refreshBalances()
    }
  }, [refreshBalances])

  const onMintPosition = useCallback(async () => {
    setTxState(TransactionState.Sending)
    setTxState(await mintPosition())
  }, [])

  // Formatted Data

  const positionStrings: string[] = useMemo(() => {
    return positions.map((pos) => {
      return `${
        pos.positionId ? pos.positionId : 'No id'
      }: ${pos.amount0.toSignificant()} and ${pos.amount1.toSignificant()} liquidity , owed ${
        pos.tokensOwed0 ? pos.tokensOwed0.toString() : '0'
      } and ${pos.tokensOwed1 ? pos.tokensOwed1.toString() : '0'}`
    })
  }, [positions])

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
      <h3>{`${CurrentConfig.tokens.token0.symbol} Balance: ${token0Balance}`}</h3>
      <h3>{`${CurrentConfig.tokens.token1.symbol} Balance: ${token1Balance}`}</h3>
      <div>
        Positions:{' '}
        {positionStrings.map((s, i) => (
          <p key={i}>{s}</p>
        ))}
      </div>
      <button
        onClick={() => onMintPosition()}
        disabled={
          txState === TransactionState.Sending || getProvider() === null
        }>
        <p>Mint Position</p>
      </button>
    </div>
  )
}

export default Example
