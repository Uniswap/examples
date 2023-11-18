import { ethers } from 'ethers'
import { CurrentConfig } from '../config'
import { SwapQuoter } from '@uniswap/v3-sdk'
import { getProvider } from '../libs/providers'
import { toReadableAmount } from '../libs/conversion'
import { CurrencyAmount } from '@uniswap/sdk-core'

export async function quote(): Promise<string> {
  const rawInputAmount = ethers.utils
    .parseUnits(CurrentConfig.tokens.amountIn, CurrentConfig.tokens.in.decimals)
    .toBigInt()

  const currencyAmountIn = CurrencyAmount.fromRawAmount(
    CurrentConfig.tokens.in,
    rawInputAmount
  )

  const provider = getProvider()

  const currencyAmountOut = await SwapQuoter.quoteExactInputSingle(
    currencyAmountIn,
    CurrentConfig.tokens.out,
    CurrentConfig.tokens.poolFee,
    provider
  )

  return toReadableAmount(
    currencyAmountOut.quotientBigInt,
    CurrentConfig.tokens.out.decimals
  )
}
