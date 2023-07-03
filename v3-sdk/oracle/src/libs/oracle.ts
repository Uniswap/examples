import { ethers } from 'ethers'
import { computePoolAddress, tickToPrice, Pool } from '@uniswap/v3-sdk'
import { CurrentConfig } from '../config'
import { FACTORY_ADDRESS } from '@uniswap/v3-sdk'
import { createWallet } from './providers'
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import { Price, Token } from '@uniswap/sdk-core'

// constants
const poolAddress = computePoolAddress({
  factoryAddress: FACTORY_ADDRESS,
  tokenA: CurrentConfig.pool.token0,
  tokenB: CurrentConfig.pool.token1,
  fee: CurrentConfig.pool.fee,
})

// ethers
const wallet = createWallet()
const poolContract = new ethers.Contract(
  poolAddress,
  IUniswapV3PoolABI.abi,
  wallet
)

// Observation type
export interface Observation {
  secondsAgo: number
  tickCumulative: bigint
  secondsPerLiquidityCumulativeX128: bigint
}

export async function increaseObservationCardinalityNext(
  observationCardinalityNext: number
) {
  return poolContract['increaseObservationCardinalityNext'](
    observationCardinalityNext
  )
}

export async function getAverages(): Promise<{
  twap: Price<Token, Token>
  twal: bigint
}> {
  const secondsAgo = CurrentConfig.timeInterval
  const observations: Observation[] = await observe(secondsAgo)

  const slot0 = await poolContract['slot0']()
  const liquidity = await poolContract['liquidity']()
  const pool = new Pool(
    CurrentConfig.pool.token0,
    CurrentConfig.pool.token1,
    CurrentConfig.pool.fee,
    slot0.sqrtPriceX96,
    liquidity,
    slot0.tick
  )

  const twap = calculateTWAP(observations, pool)
  const twal = calculateTWAL(observations)

  return { twap, twal }
}

async function observe(secondsAgo: number): Promise<Observation[]> {
  const timestamps = [0, secondsAgo]

  const [tickCumulatives, secondsPerLiquidityCumulatives] =
    await poolContract.observe(timestamps)

  const observations: Observation[] = timestamps.map((time, i) => {
    return {
      secondsAgo: time,
      tickCumulative: BigInt(tickCumulatives[i]),
      secondsPerLiquidityCumulativeX128: BigInt(
        secondsPerLiquidityCumulatives[i]
      ),
    }
  })
  return observations
}

function calculateTWAP(observations: Observation[], pool: Pool) {
  const diffTickCumulative =
    observations[0].tickCumulative - observations[1].tickCumulative
  const secondsBetween = observations[1].secondsAgo - observations[0].secondsAgo

  const averageTick = Number(diffTickCumulative / BigInt(secondsBetween))

  return tickToPrice(pool.token0, pool.token1, averageTick)
}

function calculateTWAL(observations: Observation[]): bigint {
  const diffSecondsPerLiquidityX128 =
    observations[0].secondsPerLiquidityCumulativeX128 -
    observations[1].secondsPerLiquidityCumulativeX128

  const secondsBetween = observations[1].secondsAgo - observations[0].secondsAgo
  const secondsBetweenX128 = BigInt(secondsBetween) << BigInt(128)

  return secondsBetweenX128 / diffSecondsPerLiquidityX128
}
