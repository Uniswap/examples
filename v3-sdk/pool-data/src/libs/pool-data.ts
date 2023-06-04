import { ethers } from 'ethers'
import { Tick, computePoolAddress, Pool, TickMath } from '@uniswap/v3-sdk'
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import { POOL_FACTORY_CONTRACT_ADDRESS } from './constants'
import { getMainnetProvider } from './providers'
import axios from 'axios'
import { CurrentConfig } from '../config'
import JSBI from 'jsbi'

export async function getFullPool(): Promise<{
  pool: Pool
  ticks: BarChartTick[]
}> {
  const poolAddress = computePoolAddress({
    factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
    tokenA: CurrentConfig.pool.tokenA,
    tokenB: CurrentConfig.pool.tokenB,
    fee: CurrentConfig.pool.fee,
  })

  const poolContract = new ethers.Contract(
    poolAddress,
    IUniswapV3PoolABI.abi,
    getMainnetProvider()
  )
  const [slot0, liquidity, graphTicks] = await Promise.all([
    poolContract.slot0(),
    poolContract.liquidity(),
    getFullTickData(poolAddress),
  ])

  const sdkTicks = graphTicks.map((graphTick: GraphTick) => {
    return new Tick({
      index: +graphTick.tickIdx,
      liquidityGross: graphTick.liquidityGross,
      liquidityNet: graphTick.liquidityNet,
    })
  })

  const fullPool = new Pool(
    CurrentConfig.pool.tokenA,
    CurrentConfig.pool.tokenB,
    CurrentConfig.pool.fee,
    slot0.sqrtPriceX96,
    liquidity,
    slot0.tick,
    sdkTicks
  )

  const tickSpacing = fullPool.tickSpacing
  const activeTickIdx = (
    await fullPool.tickDataProvider.nextInitializedTickWithinOneWord(
      fullPool.tickCurrent,
      fullPool.tickCurrent === TickMath.MIN_TICK ? false : true,
      tickSpacing
    )
  )[0]

  const processedTicks = processTicks(
    activeTickIdx,
    fullPool.liquidity,
    graphTicks
  )

  const barChartTicks: BarChartTick[] = processedTicks.map((processedTick) => {
    return {
      tickIdx: processedTick.tickIdx,
      liquidityActive: Math.abs(
        parseFloat(processedTick.liquidityActive.toString())
      ),
      isCurrent: processedTick.isCurrent,
    }
  })

  return {
    pool: fullPool,
    ticks: barChartTicks,
  }
}

async function getFullTickData(poolAddress: string): Promise<GraphTick[]> {
  let allTicks: GraphTick[] = []
  let skip = 0
  let loadingTicks = true
  while (loadingTicks) {
    const ticks = await getTickDataFromSubgraph(poolAddress, skip)
    allTicks = allTicks.concat(ticks)
    if (ticks.length < 1000) {
      loadingTicks = false
    } else {
      skip += 1000
    }
  }

  return allTicks
}

async function getTickDataFromSubgraph(
  poolAddress: string,
  skip: number
): Promise<GraphTick[]> {
  const ticksQuery = JSON.stringify({
    query: `{ ticks(
          where: {poolAddress: "${poolAddress.toLowerCase()}", liquidityNet_not: "0"}
          first: 1000,
          orderBy: tickIdx,
          orderDirection: asc,
          skip: ${skip}
        ) {
          tickIdx
          liquidityGross
          liquidityNet
        }
      }
    `,
  })

  const response = await axios.post(
    'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
    ticksQuery,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )

  return response.data.data.ticks
}

function processTicks(
  activeTickIdx: number,
  poolLiquidity: JSBI,
  graphTicks: GraphTick[]
): ProcessedTick[] {
  const tickIdxToTickDictionary: Record<string, GraphTick> = Object.fromEntries(
    graphTicks.map((graphTick) => [graphTick.tickIdx, graphTick])
  )

  const activeTickArrayIndex = graphTicks.findIndex(
    (tick) => tick.tickIdx === activeTickIdx.toString()
  )

  const liquidity = poolLiquidity

  const activeProcessedTick: ProcessedTick = {
    tickIdx: activeTickIdx,
    liquidityActive: liquidity,
    liquidityGross: JSBI.BigInt(0),
    liquidityNet: JSBI.BigInt(0),
    isCurrent: true,
  }

  const activeTick = tickIdxToTickDictionary[activeTickIdx]
  if (activeTick) {
    activeProcessedTick.liquidityGross = JSBI.BigInt(activeTick.liquidityGross)
    activeProcessedTick.liquidityNet = JSBI.BigInt(activeTick.liquidityNet)
  }

  const graphTicksBefore = graphTicks.slice(0, activeTickArrayIndex)
  const graphTicksAfter = graphTicks.slice(activeTickArrayIndex + 1, undefined)

  const subsequentTicks: ProcessedTick[] = computeInitializedTicks(
    activeProcessedTick,
    graphTicksAfter,
    Direction.ASC,
    tickIdxToTickDictionary
  )

  const previousTicks: ProcessedTick[] = computeInitializedTicks(
    activeProcessedTick,
    graphTicksBefore,
    Direction.DESC,
    tickIdxToTickDictionary
  )

  const processedTicks = previousTicks
    .concat(activeProcessedTick)
    .concat(subsequentTicks)

  return processedTicks
}

enum Direction {
  ASC,
  DESC,
}

function computeInitializedTicks(
  activeTickProcessed: ProcessedTick,
  tickArraySlice: GraphTick[],
  direction: Direction,
  tickIdxToTickDictionary: Record<string, GraphTick>
): ProcessedTick[] {
  let previousTickProcessed: ProcessedTick = {
    ...activeTickProcessed,
  }

  let processedTicks: ProcessedTick[] = []
  for (let i = 0; i < tickArraySlice.length; i++) {
    const currentTickIdx = +tickArraySlice[i].tickIdx

    if (
      currentTickIdx < TickMath.MIN_TICK ||
      currentTickIdx > TickMath.MAX_TICK
    ) {
      break
    }

    const currentTickProcessed: ProcessedTick = {
      tickIdx: currentTickIdx,
      liquidityActive: previousTickProcessed.liquidityActive,
      liquidityGross: JSBI.BigInt(0),
      liquidityNet: JSBI.BigInt(0),
      isCurrent: false,
    }

    const currentInitializedTick =
      tickIdxToTickDictionary[currentTickIdx.toString()]
    if (currentInitializedTick) {
      currentTickProcessed.liquidityGross = JSBI.BigInt(
        currentInitializedTick.liquidityGross
      )
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

    processedTicks.push(currentTickProcessed)
    previousTickProcessed = currentTickProcessed
  }

  if (direction == Direction.DESC) {
    processedTicks = processedTicks.reverse()
  }

  return processedTicks
}

interface GraphTick {
  tickIdx: string
  liquidityGross: string
  liquidityNet: string
}

interface ProcessedTick {
  tickIdx: number
  liquidityActive: JSBI
  liquidityGross: JSBI
  liquidityNet: JSBI
  isCurrent: boolean
}

export interface BarChartTick {
  tickIdx: number
  liquidityActive: number
  isCurrent: boolean
}
