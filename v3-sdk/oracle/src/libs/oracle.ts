import { tickToPrice, Pool } from '@uniswap/v3-sdk'
import { CurrentConfig } from '../config'
import { createWallet, getProvider } from './providers'
import { Price, Token } from '@uniswap/sdk-core'

// ethers
const wallet = createWallet()

// Pool

async function getPool(): Promise<Pool> {
  const provider = getProvider()

  if (provider === null) {
    throw new Error('Please connect a provider')
  }

  const pool = await Pool.initFromChain(
    provider,
    CurrentConfig.pool.token0,
    CurrentConfig.pool.token1,
    CurrentConfig.pool.fee
  )
  return pool
}

// Observation type
export interface Observation {
  secondsAgo: number
  tickCumulative: bigint
  secondsPerLiquidityCumulativeX128: bigint
}

export async function increaseObservationCardinalityNext(
  observationCardinalityNext: number
) {
  const pool = await getPool()
  return pool.rpcIncreaseObservationCardinalityNext(
    wallet,
    observationCardinalityNext
  )
}

export async function getAverages(): Promise<{
  twap: Price<Token, Token>
  twal: bigint
}> {
  const secondsAgo = CurrentConfig.timeInterval
  const observations: Observation[] = await observe(secondsAgo)

  const pool = await getPool()

  const twap = calculateTWAP(observations, pool)
  const twal = calculateTWAL(observations)

  return { twap, twal }
}

async function observe(secondsAgo: number): Promise<Observation[]> {
  const timestamps = [0, secondsAgo]

  const pool = await getPool()

  const observeResponse = await pool.rpcObserve(timestamps)

  const observations: Observation[] = timestamps.map((time, i) => {
    return {
      secondsAgo: time,
      tickCumulative: observeResponse.tickCumulatives[i],
      secondsPerLiquidityCumulativeX128:
        observeResponse.secondsPerLiquidityCumulativeX128s[i],
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
