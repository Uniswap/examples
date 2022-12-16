import React, { useState, useCallback } from 'react'
import './Example.css'
import { ethers } from 'ethers'
import { CurrentConfig } from '../config'
import { computePoolAddress, Pool, Route, Trade } from '@uniswap/v3-sdk'
import Quoter from '@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json'
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import {
  POOL_FACTORY_CONTRACT_ADDRESS,
  QUOTER_CONTRACT_ADDRESS,
} from '../libs/constants'
import { getProvider } from '../libs/providers'
import { fromReadableAmount, displayTrade } from '../libs/utils'
import { BigintIsh, Token, TradeType, CurrencyAmount } from '@uniswap/sdk-core'

const getPoolAddress = () => {
  return computePoolAddress({
    factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
    tokenA: CurrentConfig.tokens.in,
    tokenB: CurrentConfig.tokens.out,
    fee: CurrentConfig.tokens.fee,
  })
}

const getPoolState = async (): Promise<{
  liquidity: BigintIsh
  sqrtPriceX96: BigintIsh
  tick: number
}> => {
  const poolContract = new ethers.Contract(
    getPoolAddress(),
    IUniswapV3PoolABI.abi,
    getProvider()!
  )

  const [liquidity, slot] = await Promise.all([
    poolContract.liquidity(),
    poolContract.slot0(),
  ])

  return {
    liquidity,
    sqrtPriceX96: slot[0],
    tick: slot[1],
  }
}

const quote = async (): Promise<number> => {
  const quoterContract = new ethers.Contract(
    QUOTER_CONTRACT_ADDRESS,
    Quoter.abi,
    getProvider()!
  )

  const quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(
    CurrentConfig.tokens.in.address,
    CurrentConfig.tokens.out.address,
    CurrentConfig.tokens.fee,
    fromReadableAmount(
      CurrentConfig.tokens.amountIn,
      CurrentConfig.tokens.in.decimals
    ),
    0
  )

  return quotedAmountOut
}

const getTrade = async (
  quotedAmountOut: number
): Promise<Trade<Token, Token, TradeType>> => {
  const poolState = await getPoolState()
  const pool = new Pool(
    CurrentConfig.tokens.in,
    CurrentConfig.tokens.out,
    CurrentConfig.tokens.fee,
    poolState.sqrtPriceX96,
    poolState.liquidity,
    poolState.tick
  )

  const swapRoute = new Route(
    [pool],
    CurrentConfig.tokens.in,
    CurrentConfig.tokens.out
  )

  const uncheckedTrade = Trade.createUncheckedTrade({
    route: swapRoute,
    inputAmount: CurrencyAmount.fromRawAmount(
      CurrentConfig.tokens.in,
      fromReadableAmount(
        CurrentConfig.tokens.amountIn,
        CurrentConfig.tokens.in.decimals
      )
    ),
    outputAmount: CurrencyAmount.fromRawAmount(
      CurrentConfig.tokens.out,
      quotedAmountOut
    ),
    tradeType: TradeType.EXACT_INPUT,
  })

  return uncheckedTrade
}

const Example = () => {
  const [trade, setTrade] = useState<Trade<Token, Token, TradeType>>()

  const onCreateTrade = useCallback(async () => {
    const outputAmount = await quote()
    setTrade(await getTrade(outputAmount))
  }, [])

  return (
    <div className="App">
      {CurrentConfig.rpc.mainnet === '' && (
        <h2 className="error">Please set your mainnet RPC URL in config.ts</h2>
      )}
      <h3>
        Trading {CurrentConfig.tokens.amountIn} {CurrentConfig.tokens.in.symbol}{' '}
        for {CurrentConfig.tokens.out.symbol}
      </h3>
      <h3>{trade && `Constructed Trade: ${displayTrade(trade)}`}</h3>
      <button onClick={onCreateTrade}>
        <p>Create Trade</p>
      </button>
    </div>
  )
}

export default Example
