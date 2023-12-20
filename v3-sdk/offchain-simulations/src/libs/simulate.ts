import { Pool, SwapRouter, Trade } from '@uniswap/v3-sdk'
import { PoolIdentifier } from './constants'
import { CurrentConfig } from '../config'
import { CurrencyAmount, Token, TradeType } from '@uniswap/sdk-core'
import {
  TransactionState,
  getProvider,
  getWallet,
  getWalletAddress,
} from './providers'
import { fromReadableAmount } from './conversion'

export async function initializePools(): Promise<Pool[]> {
  const promises: Promise<Pool>[] = []

  for (const identifier of CurrentConfig.pools) {
    promises.push(initializePool(identifier))
  }

  const initializedPools = await Promise.all(promises)

  return initializedPools
}

async function initializePool(poolIdentifier: PoolIdentifier): Promise<Pool> {
  const provider = getProvider()

  if (provider === null) {
    throw new Error('No Provider')
  }

  const pool = await Pool.initFromChain({
    provider,
    tokenA: poolIdentifier.tokenA,
    tokenB: poolIdentifier.tokenB,
    fee: poolIdentifier.fee,
  })

  await pool.initializeTicks()

  return pool
}

export async function getBestTradeExactIn(
  pools: Pool[] | undefined
): Promise<Trade<Token, Token, TradeType.EXACT_INPUT>> {
  if (pools === undefined) {
    throw new Error('Pools are not initialized')
  }

  const currencyAmountIn = CurrencyAmount.fromRawAmount(
    CurrentConfig.tokens.in,
    fromReadableAmount(
      CurrentConfig.tokens.readableAmountIn,
      CurrentConfig.tokens.in.decimals
    )
  )

  const bestTrades = await Trade.bestTradeExactIn(
    pools,
    currencyAmountIn,
    CurrentConfig.tokens.out
  )
  return bestTrades[0]
}

export async function executeTrade(
  trade: Trade<Token, Token, TradeType>
): Promise<TransactionState> {
  const walletAddress = getWalletAddress()
  const provider = getProvider()

  if (!walletAddress || !provider) {
    throw new Error('Cannot execute a trade without a connected wallet')
  }

  const wallet = getWallet()

  let response = null

  while (response === null) {
    try {
      response = await SwapRouter.executeTrade({
        trades: trade,
        signer: wallet,
      })

      if (response === null) {
        continue
      }
    } catch (e) {
      console.log(`Response error: `, e)
      break
    }
  }

  if (response) {
    return TransactionState.Sent
  } else {
    return TransactionState.Failed
  }
}
