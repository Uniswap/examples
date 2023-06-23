import { FeeAmount, Pool, TickMath, tickToPrice } from '@uniswap/v3-sdk'
import JSBI from 'jsbi'
import { TickProcessed, GraphTick, BarChartTick } from './interfaces'
import { Token, CurrencyAmount } from '@uniswap/sdk-core'

const MAX_INT128 = JSBI.subtract(
  JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(128)),
  JSBI.BigInt(1)
)

export async function createBarChartTicks(
  tickCurrent: number,
  poolLiquidity: JSBI,
  tickSpacing: number,
  token0: Token,
  token1: Token,
  numSurroundingTicks: number,
  feeTier: FeeAmount,
  graphTicks: GraphTick[]
): Promise<BarChartTick[]> {
  const processedTicks = processTicks(
    tickCurrent,
    poolLiquidity,
    tickSpacing,
    token0,
    token1,
    numSurroundingTicks,
    graphTicks
  )

  const barTicks = await Promise.all(
    processedTicks.map(async (tick: TickProcessed) => {
      return calculateLockedLiqudity(tick, token0, token1, tickSpacing, feeTier)
    })
  )
  barTicks.map((entry, i) => {
    if (i > 0) {
      barTicks[i - 1].liquidityLockedToken0 = entry.liquidityLockedToken0
      barTicks[i - 1].liquidityLockedToken1 = entry.liquidityLockedToken1
    }
  })
  return barTicks
}

function processTicks(
  tickCurrent: number,
  poolLiquidity: JSBI,
  tickSpacing: number,
  token0: Token,
  token1: Token,
  numSurroundingTicks: number,
  graphTicks: GraphTick[]
): TickProcessed[] {
  const tickIdxToTickDictionary: Record<string, GraphTick> = Object.fromEntries(
    graphTicks.map((graphTick) => [graphTick.tickIdx, graphTick])
  )

  const liquidity = poolLiquidity

  let activeTickIdx = Math.floor(tickCurrent / tickSpacing) * tickSpacing

  if (activeTickIdx <= TickMath.MIN_TICK) {
    activeTickIdx = TickMath.MAX_TICK
  }

  const activeTickProcessed: TickProcessed = {
    tickIdx: activeTickIdx,
    liquidityActive: liquidity,
    liquidityNet: JSBI.BigInt(0),
    price0: parseFloat(
      tickToPrice(token0, token1, activeTickIdx).toSignificant(18)
    ),
    price1: parseFloat(
      tickToPrice(token1, token0, activeTickIdx).toSignificant(18)
    ),
    isCurrent: true,
  }

  const activeTick = tickIdxToTickDictionary[activeTickIdx]
  if (activeTick) {
    activeTickProcessed.liquidityNet = JSBI.BigInt(activeTick.liquidityNet)
  }

  const subsequentTicks: TickProcessed[] = computeInitializedTicks(
    activeTickProcessed,
    numSurroundingTicks,
    tickSpacing,
    Direction.ASC,
    token0,
    token1,
    tickIdxToTickDictionary
  )

  const previousTicks: TickProcessed[] = computeInitializedTicks(
    activeTickProcessed,
    numSurroundingTicks,
    tickSpacing,
    Direction.DESC,
    token0,
    token1,
    tickIdxToTickDictionary
  )

  const TickProcesseds = previousTicks
    .concat(activeTickProcessed)
    .concat(subsequentTicks)

  return TickProcesseds
}

enum Direction {
  ASC,
  DESC,
}

function computeInitializedTicks(
  activeTickProcessed: TickProcessed,
  numSurroundingTicks: number,
  tickSpacing: number,
  direction: Direction,
  token0: Token,
  token1: Token,
  tickIdxToTickDictionary: Record<string, GraphTick>
): TickProcessed[] {
  let previousTickProcessed: TickProcessed = {
    ...activeTickProcessed,
  }

  let ticksProcessed: TickProcessed[] = []
  for (let i = 0; i < numSurroundingTicks; i++) {
    const currentTickIdx =
      direction === Direction.ASC
        ? previousTickProcessed.tickIdx + tickSpacing
        : previousTickProcessed.tickIdx - tickSpacing

    if (
      currentTickIdx < TickMath.MIN_TICK ||
      currentTickIdx > TickMath.MAX_TICK
    ) {
      break
    }

    const currentTickProcessed: TickProcessed = {
      tickIdx: currentTickIdx,
      liquidityActive: previousTickProcessed.liquidityActive,
      liquidityNet: JSBI.BigInt(0),
      price0: parseFloat(
        tickToPrice(token0, token1, currentTickIdx).toSignificant(18)
      ),
      price1: parseFloat(
        tickToPrice(token1, token0, currentTickIdx).toSignificant(18)
      ),
      isCurrent: false,
    }

    const currentInitializedTick =
      tickIdxToTickDictionary[currentTickIdx.toString()]
    if (currentInitializedTick) {
      currentTickProcessed.liquidityNet = JSBI.BigInt(
        currentInitializedTick.liquidityNet
      )
    }

    if (direction == Direction.ASC && currentInitializedTick) {
      currentTickProcessed.liquidityActive = JSBI.add(
        previousTickProcessed.liquidityActive,
        JSBI.BigInt(currentInitializedTick.liquidityNet)
      )
    } else if (
      direction == Direction.DESC &&
      JSBI.notEqual(previousTickProcessed.liquidityNet, JSBI.BigInt(0))
    ) {
      // We are iterating descending, so look at the previous tick and apply any net liquidity.
      currentTickProcessed.liquidityActive = JSBI.subtract(
        previousTickProcessed.liquidityActive,
        previousTickProcessed.liquidityNet
      )
    }

    ticksProcessed.push(currentTickProcessed)
    previousTickProcessed = currentTickProcessed
  }

  if (direction == Direction.DESC) {
    ticksProcessed = ticksProcessed.reverse()
  }

  return ticksProcessed
}

async function calculateLockedLiqudity(
  tick: TickProcessed,
  token0: Token,
  token1: Token,
  tickSpacing: number,
  feeTier: FeeAmount
): Promise<BarChartTick> {
  const sqrtPriceX96 = TickMath.getSqrtRatioAtTick(tick.tickIdx)
  const liqGross = JSBI.greaterThan(tick.liquidityNet, JSBI.BigInt(0))
    ? tick.liquidityNet
    : JSBI.multiply(tick.liquidityNet, JSBI.BigInt('-1'))
  const mockTicks = [
    {
      index: tick.tickIdx - tickSpacing,
      liquidityGross: liqGross,
      liquidityNet: JSBI.multiply(tick.liquidityNet, JSBI.BigInt('-1')),
    },
    {
      index: tick.tickIdx,
      liquidityGross: liqGross,
      liquidityNet: tick.liquidityNet,
    },
  ]
  const pool =
    token0 && token1 && feeTier
      ? new Pool(
          token0,
          token1,
          feeTier,
          sqrtPriceX96,
          tick.liquidityActive,
          tick.tickIdx,
          mockTicks
        )
      : undefined
  const prevSqrtX96 = TickMath.getSqrtRatioAtTick(tick.tickIdx - tickSpacing)
  const maxAmountToken0 = token0
    ? CurrencyAmount.fromRawAmount(token0, MAX_INT128.toString())
    : undefined
  const outputRes0 =
    pool && maxAmountToken0
      ? await pool.getOutputAmount(maxAmountToken0, prevSqrtX96)
      : undefined

  const token1Amount = outputRes0?.[0] as CurrencyAmount<Token> | undefined

  const amount0 = token1Amount
    ? parseFloat(token1Amount.toExact()) * tick.price1
    : 0
  const amount1 = token1Amount ? parseFloat(token1Amount.toExact()) : 0

  return {
    tickIdx: tick.tickIdx,
    liquidityActive: parseFloat(tick.liquidityActive.toString()),
    liquidityLockedToken0: amount0,
    liquidityLockedToken1: amount1,
    price0: tick.price0,
    price1: tick.price1,
    isCurrent: tick.isCurrent,
  }
}
