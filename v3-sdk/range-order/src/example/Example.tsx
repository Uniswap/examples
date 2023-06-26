import React, { useCallback, useEffect, useMemo, useState } from 'react'
import './Example.css'
import { Environment, CurrentConfig } from '../config'
import { getCurrencyBalance } from '../libs/balance'
import {
  getPositionIds,
  getPositionInfo,
  mintPosition,
  PositionInfo,
} from '../libs/positions'
import {
  connectBrowserExtensionWallet,
  getProvider,
  TransactionState,
  getWalletAddress,
} from '../libs/providers'
import { WETH_TOKEN } from '../libs/constants'
import { wrapETH } from '../libs/wallet'
import { FeeAmount } from '@uniswap/v3-sdk'
import { Ether, Price, Token } from '@uniswap/sdk-core'
import { getPrice } from '../libs/pool'
import {
  buyWETH,
  getToken1FromMockPool,
  sellWETH,
} from '../libs/mockMarketMaker'

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
  const [mmmBalance1, setMMMBalance1] = useState<string>()
  const [mmmBalance0, setMMMBalance0] = useState<string>()
  const [positionIds, setPositionIds] = useState<number[]>([])
  const [positionsInfo, setPositionsInfo] = useState<PositionInfo[]>([])
  const [txState, setTxState] = useState<TransactionState>(TransactionState.New)
  const [blockNumber, setBlockNumber] = useState<number>(0)
  const [price, setPrice] = useState<Price<Token, Token>>()

  // Listen for new blocks and update the wallet
  useOnBlockUpdated(async (blockNumber: number) => {
    refreshBalances()
    refreshPoolPrice()
    setBlockNumber(blockNumber)
    setupMMM()
  })

  // Update Pool Price on every block
  const refreshPoolPrice = useCallback(async () => {
    setPrice(await getPrice())
  }, [])

  // Update wallet state given a block number
  // If environment is local and account has no WETH, wraps 1 ETH
  const refreshBalances = useCallback(async () => {
    const provider = getProvider()
    const address = getWalletAddress()
    if (!provider || !address) {
      return
    }

    const balance0 = await getCurrencyBalance(
      provider,
      address,
      CurrentConfig.tokens.token0
    )

    if (
      Number(balance0) < CurrentConfig.tokens.token0Amount &&
      CurrentConfig.env === Environment.LOCAL &&
      CurrentConfig.tokens.token0 === WETH_TOKEN
    ) {
      wrapETH(CurrentConfig.tokens.token0Amount)
    }
    // Set Balances
    setToken0Balance(balance0)
    setToken1Balance(
      await getCurrencyBalance(provider, address, CurrentConfig.tokens.token1)
    )

    // Set Position Info
    const ids = await getPositionIds()
    setPositionIds(ids)
    setPositionsInfo(await Promise.all(ids.map(getPositionInfo)))
  }, [])

  // MMM gets Token1 for half his ETH balance.
  const setupMMM = useCallback(async () => {
    if (CurrentConfig.env === Environment.LOCAL) {
      const provider = getProvider()
      const address = CurrentConfig.mockMarketMakerWallet.address
      if (!provider || !address) {
        return
      }

      const balance1 = await getCurrencyBalance(
        provider,
        address,
        CurrentConfig.tokens.token1
      )

      setMMMBalance1(balance1)

      const balance0 = Math.floor(
        Number(await getCurrencyBalance(provider, address, Ether.onChain(1)))
      ).toString()

      setMMMBalance0(balance0)

      if (balance1 === '0') {
        await getToken1FromMockPool(5000)
      }
    }
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

  // Mock Market Maker Calls. Only used locally.
  const onBuyWETH = useCallback(async () => {
    setTxState(TransactionState.Sending)
    setTxState(await buyWETH())
  }, [])

  const onSellWETH = useCallback(async () => {
    setTxState(TransactionState.Sending)
    setTxState(await sellWETH())
  }, [])
  // const onCreateTakeProfitOrder = useCallback(async () => {
  //   setTxState(TransactionState.Sending)
  //   setTxState(await mintPosition())
  // }, [])

  // Formatted Data

  const positionInfoStrings: string[] = useMemo(() => {
    if (positionIds.length !== positionsInfo.length) {
      return []
    }

    return positionIds
      .map((id, index) => [id, positionsInfo[index]])
      .map((info) => {
        const id = info[0]
        const posInfo = info[1] as PositionInfo
        return `${id}: ${posInfo.liquidity.toString()} liquidity, owed ${posInfo.tokensOwed0.toString()} and ${posInfo.tokensOwed1.toString()}`
      })
  }, [positionIds, positionsInfo])

  return (
    <div className="App">
      <div className="grid-container">
        <div className="chain">
          <h2>Chain:</h2>
          <h4>Environment: {Environment[CurrentConfig.env]}</h4>
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
          <h4>{`Block Number: ${blockNumber + 1}`}</h4>
        </div>
        <div className="pool">
          <h2>Pool:</h2>
          <p>
            {CurrentConfig.tokens.token0.symbol} /{' '}
            {CurrentConfig.tokens.token1.symbol} Pool with{' '}
            {FeeAmount[CurrentConfig.tokens.poolFee]} fee
          </p>
          <h4>Price:</h4>
          {price === undefined ? (
            <p>Fetching...</p>
          ) : (
            <p>
              1 {CurrentConfig.tokens.token0.symbol} = {price.toSignificant(6)}{' '}
              {CurrentConfig.tokens.token1.symbol}
            </p>
          )}
          {CurrentConfig.env === Environment.LOCAL && (
            <div>
              <p>Simulate swaps by other market participants:</p>
              {mmmBalance1 === '0' && <p>...Loading</p>}
              {mmmBalance1 !== '0' && (
                <p>
                  MM Balance:{' '}
                  {mmmBalance1 +
                    ' ' +
                    CurrentConfig.mockMarketMakerPool.token1.symbol}{' '}
                  {mmmBalance0} ETH
                </p>
              )}
              <button
                className="trade-button"
                onClick={() => onBuyWETH()}
                disabled={
                  txState === TransactionState.Sending ||
                  getProvider() === null ||
                  mmmBalance1 === '0'
                }>
                Buy WETH
              </button>
              <button
                className="trade-button"
                onClick={() => onSellWETH()}
                disabled={
                  txState === TransactionState.Sending ||
                  getProvider() === null ||
                  mmmBalance1 === '0'
                }>
                Sell WETH
              </button>
            </div>
          )}
        </div>
        <div className="wallet">
          <h2>Wallet:</h2>
          <div>
            <h4>Wallet Address:</h4>
            {`${getWalletAddress()}`}
          </div>
          {CurrentConfig.env === Environment.WALLET_EXTENSION &&
            !getWalletAddress() && (
              <button onClick={onConnectWallet}>Connect Wallet</button>
            )}
          <h4>{`Transaction State: ${txState}`}</h4>
          <p>{`${CurrentConfig.tokens.token0.symbol} Balance: ${token0Balance}`}</p>
          <p>{`${CurrentConfig.tokens.token1.symbol} Balance: ${token1Balance}`}</p>
        </div>
        <div className="positions">
          <div>
            Positions:{' '}
            {positionInfoStrings.map((s, i) => (
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
      </div>
    </div>
  )
}

export default Example
