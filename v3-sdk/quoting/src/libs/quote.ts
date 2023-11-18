import { ethers } from 'ethers'
import { CurrentConfig } from '../config'
import { computePoolAddress, Pool, Route, SwapQuoter } from '@uniswap/v3-sdk'
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import { POOL_FACTORY_CONTRACT_ADDRESS } from '../libs/constants'
import { getProvider } from '../libs/providers'
import { toReadableAmount } from '../libs/conversion'
import { CurrencyAmount, TradeType } from '@uniswap/sdk-core'

export async function quote(): Promise<string> {
  const poolConstants = await getPoolConstants()

  console.log(poolConstants)
  const pool = new Pool(
    CurrentConfig.tokens.in,
    CurrentConfig.tokens.out,
    poolConstants.fee,
    poolConstants.sqrtRatioX96,
    poolConstants.liquidity,
    poolConstants.tickCurrent
  )

  const route = new Route(
    [pool],
    CurrentConfig.tokens.in,
    CurrentConfig.tokens.out
  )

  const quotedAmountOut = await SwapQuoter.callQuoter(
    route,
    CurrencyAmount.fromRawAmount(
      CurrentConfig.tokens.in,
      CurrentConfig.tokens.amountIn
    ),
    TradeType.EXACT_INPUT,
    getProvider()
  )

  return toReadableAmount(
    quotedAmountOut.quotientBigInt,
    CurrentConfig.tokens.out.decimals
  )
}

async function getPoolConstants(): Promise<{
  token0: string
  token1: string
  fee: number
  sqrtRatioX96: string
  liquidity: string
  tickCurrent: number
}> {
  const currentPoolAddress = computePoolAddress({
    factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
    tokenA: CurrentConfig.tokens.in,
    tokenB: CurrentConfig.tokens.out,
    fee: CurrentConfig.tokens.poolFee,
  })

  const poolContract = new ethers.Contract(
    currentPoolAddress,
    IUniswapV3PoolABI.abi,
    getProvider()
  )
  const [token0, token1, fee, slot0, liquidity] = await Promise.all([
    poolContract.token0(),
    poolContract.token1(),
    poolContract.fee(),
    poolContract.slot0(),
    poolContract.liquidity(),
  ])

  return {
    token0,
    token1,
    fee,
    sqrtRatioX96: slot0.sqrtPriceX96.toString(),
    liquidity: liquidity.toString(),
    tickCurrent: slot0.tick,
  }
}
