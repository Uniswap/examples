import { ethers } from 'ethers'
import { CurrentConfig } from '../config'
import { computePoolAddress } from '@uniswap/v3-sdk'
import QuoterV2 from '@uniswap/v3-periphery/artifacts/contracts/lens/QuoterV2.sol/QuoterV2.json'
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import {
  POOL_FACTORY_CONTRACT_ADDRESS,
  QUOTERV2_CONTRACT_ADDRESS,
} from './constants'
import { getProvider } from './providers'
import { toReadableAmount, fromReadableAmount } from './conversion'

export async function quote(): Promise<string> {
  const quoterV2Contract = new ethers.Contract(
    QUOTERV2_CONTRACT_ADDRESS,
    QuoterV2.abi,
    getProvider()
  )
  const poolConstants = await getPoolConstants()

  // see https://github.com/Uniswap/v3-periphery/blob/0682387198a24c7cd63566a2c58398533860a5d1/contracts/interfaces/IQuoterV2.sol#L46
  const {
    amountOut: quotedAmountOut,
    // uncomment if you any extra result
    //sqrtPriceX96After,
    //initializedTicksCrossed,
    //gasEstimate,
  } = await quoterV2Contract.callStatic.quoteExactInputSingle({
    tokenIn: poolConstants.token0,
    tokenOut: poolConstants.token1,
    fee: poolConstants.fee,
    amountIn: fromReadableAmount(
      CurrentConfig.tokens.amountIn,
      CurrentConfig.tokens.in.decimals
    ).toString(),
    sqrtPriceLimitX96: 0,
  })

  return toReadableAmount(quotedAmountOut, CurrentConfig.tokens.out.decimals)
}

async function getPoolConstants(): Promise<{
  token0: string
  token1: string
  fee: number
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
  const [token0, token1, fee] = await Promise.all([
    poolContract.token0(),
    poolContract.token1(),
    poolContract.fee(),
  ])

  return {
    token0,
    token1,
    fee,
  }
}
