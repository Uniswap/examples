import React, { useCallback, useEffect, useState } from 'react'
import './Example.css'
import { Environment, CurrentConfig } from '../config'
import { getCurrencyBalance } from '../libs/balance'
import { getPositionInfo, PositionInfo } from '../libs/positions'
import {
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
import {
  TakeProfitOrder,
  constructTakeProfitOrder,
  mintTakeProfitOrder,
  watchTakeProfitOrder,
} from '../libs/range-order'

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
  const [positionId, setPositionId] = useState<number>()
  const [positionInfo, setPositionInfo] = useState<PositionInfo>()
  const [rangeOrder, setRangeOrder] = useState<TakeProfitOrder>()
  const [txState, setTxState] = useState<TransactionState>(TransactionState.New)
  const [blockNumber, setBlockNumber] = useState<number>(0)
  const [price, setPrice] = useState<Price<Token, Token>>()

  // Listen for new blocks and update the wallet
  useOnBlockUpdated(async (blockNumber: number) => {
    refreshBalances()
    refreshPosition()
    refreshPoolPrice()
    setBlockNumber(blockNumber)
    setupMMM()
    watchRangeOrder()
  })

  // Update Pool Price on every block
  const refreshPoolPrice = useCallback(async () => {
    setPrice(await getPrice())
  }, [])

  // Update wallet state given a block number
  // If environment is local and account has no WETH and no position, wraps 1 ETH
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
      CurrentConfig.tokens.token0 === WETH_TOKEN &&
      rangeOrder === undefined
    ) {
      wrapETH(CurrentConfig.tokens.token0Amount)
    }
    // Set Balances
    setToken0Balance(balance0)
    setToken1Balance(
      await getCurrencyBalance(provider, address, CurrentConfig.tokens.token1)
    )
  }, [rangeOrder])

  const refreshPosition = useCallback(async () => {
    // Set Position Info
    if (positionId !== undefined) {
      setPositionInfo(await getPositionInfo(positionId))
    }
  }, [positionId])

  const watchRangeOrder = useCallback(async () => {
    if (positionId !== undefined && rangeOrder !== undefined) {
      const state = await watchTakeProfitOrder(positionId, rangeOrder)
      if (state === TransactionState.Sent) {
        setRangeOrder(undefined)
        setPositionId(undefined)
      }
    }
  }, [positionId, rangeOrder])

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

  const onCreateTakeProfitOrder = useCallback(async () => {
    if (!price || token0Balance === '0') {
      return
    }

    setTxState(TransactionState.Sending)
    const order = await constructTakeProfitOrder(true, Number(token0Balance))
    const orderId = await mintTakeProfitOrder(order)
    if (orderId === undefined) {
      setTxState(TransactionState.Failed)
    } else {
      setRangeOrder(order)
      setPositionId(orderId)
      setPositionInfo(await getPositionInfo(orderId))
      setTxState(TransactionState.Sent)
    }
  }, [price, token0Balance])

  // Mock Market Maker Calls. Only used locally.
  const onBuyWETH = useCallback(async () => {
    setTxState(TransactionState.Sending)
    setTxState(await buyWETH())
  }, [])

  const onSellWETH = useCallback(async () => {
    setTxState(TransactionState.Sending)
    setTxState(await sellWETH())
  }, [])

  return (
    <div className="App">
      {CurrentConfig.env === Environment.LOCAL && (
        <div className="grid-container">
          <div className="chain">
            <h2>Chain:</h2>
            <h4>Environment: {Environment[CurrentConfig.env]}</h4>
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
                1 {CurrentConfig.tokens.token0.symbol} ={' '}
                {price.toSignificant(6)} {CurrentConfig.tokens.token1.symbol}
              </p>
            )}
            {CurrentConfig.env === Environment.LOCAL && (
              <div>
                <p>Simulate swaps by other market participants:</p>
                {mmmBalance1 === '0' && mmmBalance0 === '0' && (
                  <p>...Loading</p>
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
            <h4>{`Transaction State: ${txState}`}</h4>
            <p>{`${CurrentConfig.tokens.token0.symbol} Balance: ${token0Balance}`}</p>
            <p>{`${CurrentConfig.tokens.token1.symbol} Balance: ${token1Balance}`}</p>
          </div>
          <div className="positions">
            <h2>Range Orders:</h2>
            {positionId === undefined && <p>No active order</p>}
            {positionId && positionInfo && rangeOrder && (
              <div>
                Active Order:
                <p>
                  {positionId}: {positionInfo.liquidity.toString()} liquidity
                </p>
                <p>
                  Target price: 1 {rangeOrder.position.amount0.currency.symbol}{' '}
                  = {rangeOrder.targetPrice.toSignificant(6)}{' '}
                  {rangeOrder.position.amount1.currency.symbol}
                </p>
              </div>
            )}
            <button
              onClick={() => onCreateTakeProfitOrder()}
              disabled={
                txState === TransactionState.Sending ||
                getProvider() === null ||
                positionId !== undefined ||
                token0Balance == '0'
              }>
              <p>Create Order</p>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Example
