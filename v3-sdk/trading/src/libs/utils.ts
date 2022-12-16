import { Token, TradeType } from '@uniswap/sdk-core'
import { Trade } from '@uniswap/v3-sdk'

export function fromReadableAmount(amount: number, decimals: number): number {
  return amount * Math.pow(10, decimals)
}

export function toReadableAmount(rawAmount: number, decimals: number): number {
  return rawAmount / Math.pow(10, decimals)
}

export function displayTrade(trade: Trade<Token, Token, TradeType>): string {
  return `${trade.inputAmount.toExact()} ${
    trade.inputAmount.currency.symbol
  } for ${trade.outputAmount.toExact()} ${trade.outputAmount.currency.symbol}`
}
