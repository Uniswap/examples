import {
  Currency,
  CurrencyAmount,
  Percent,
  Token,
  TradeType,
} from '@uniswap/sdk-core'
import {
  Pool,
  Route,
  SwapOptions,
  SwapQuoter,
  SwapRouter,
  Trade,
} from '@uniswap/v3-sdk'

import { CurrentConfig } from '../config'
import {
  getProvider,
  getWallet,
  getWalletAddress,
  TransactionState,
} from './providers'
import { fromReadableAmount } from './utils'

export type TokenTrade = Trade<Token, Token, TradeType>

// Trading Functions

export async function createTrade(): Promise<TokenTrade> {
  const provider = getProvider()

  if (provider === null) {
    throw new Error('No network connection to fetch Pool metadata')
  }

  const pool = await Pool.initFromChain({
    provider,
    tokenA: CurrentConfig.tokens.in,
    tokenB: CurrentConfig.tokens.out,
    fee: CurrentConfig.tokens.poolFee,
  })

  const swapRoute = new Route(
    [pool],
    CurrentConfig.tokens.in,
    CurrentConfig.tokens.out
  )

  const amountOut = await getOutputQuote(swapRoute)

  const uncheckedTrade = Trade.createUncheckedTrade({
    route: swapRoute,
    inputAmount: CurrencyAmount.fromRawAmount(
      CurrentConfig.tokens.in,
      fromReadableAmount(
        CurrentConfig.tokens.amountIn,
        CurrentConfig.tokens.in.decimals
      ).toString()
    ),
    outputAmount: amountOut as CurrencyAmount<Token>,
    tradeType: TradeType.EXACT_INPUT,
  })

  return uncheckedTrade
}

export async function executeTrade(
  trade: TokenTrade
): Promise<TransactionState> {
  const walletAddress = getWalletAddress()
  const provider = getProvider()

  if (!walletAddress || !provider) {
    throw new Error('Cannot execute a trade without a connected wallet')
  }

  const options: SwapOptions = {
    slippageTolerance: new Percent(50, 10_000), // 50 bips, or 0.50%
    deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from the current Unix time
    recipient: walletAddress,
  }

  const wallet = getWallet()

  let response = null

  while (response === null) {
    try {
      response = await SwapRouter.executeTrade({
        trades: trade,
        options,
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

export async function getOutputQuote(route: Route<Currency, Currency>) {
  const provider = getProvider()

  if (!provider) {
    throw new Error('Provider required to get pool state')
  }

  const outputQuote = await SwapQuoter.callQuoter({
    route,
    amount: CurrencyAmount.fromRawAmount(
      CurrentConfig.tokens.in,
      fromReadableAmount(
        CurrentConfig.tokens.amountIn,
        CurrentConfig.tokens.in.decimals
      ).toString()
    ),
    tradeType: TradeType.EXACT_INPUT,
    provider,
  })

  return outputQuote
}
