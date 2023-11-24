import { Token, TradeType } from '@uniswap/sdk-core'
import { Trade } from '@uniswap/v3-sdk'
import JSBI from 'jsbi'

export function fromReadableAmount(amount: number, decimals: number): bigint {
  const extraDigits = Math.pow(10, countDecimals(amount))
  const adjustedAmount = amount * extraDigits
  return (
    (BigInt(adjustedAmount) * BigInt(10) ** BigInt(decimals)) /
    BigInt(extraDigits)
  )
}

export function toReadableAmount(rawAmount: number, decimals: number): string {
  return JSBI.divide(
    JSBI.BigInt(rawAmount),
    JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals))
  ).toString()
}

function countDecimals(x: number) {
  if (Math.floor(x) === x) {
    return 0
  }
  return x.toString().split('.')[1].length || 0
}

export function displayTrade(trade: Trade<Token, Token, TradeType>): string {
  return `${trade.inputAmount.toExact()} ${
    trade.inputAmount.currency.symbol
  } for ${trade.outputAmount.toExact()} ${trade.outputAmount.currency.symbol}`
}
