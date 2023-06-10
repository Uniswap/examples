import { TickMath, tickToPrice } from '@uniswap/v3-sdk'
import JSBI from 'jsbi'
import { TickProcessed, GraphTick } from './interfaces'
import { Token } from '@uniswap/sdk-core'

export function processTicks(
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
    price0: tickToPrice(token0, token1, activeTickIdx).toFixed(6),
    price1: tickToPrice(token1, token0, activeTickIdx).toFixed(6),
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
      price0: tickToPrice(token0, token1, currentTickIdx).toFixed(6),
      price1: tickToPrice(token1, token0, currentTickIdx).toFixed(6),
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
