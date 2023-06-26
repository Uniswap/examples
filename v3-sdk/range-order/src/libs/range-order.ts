import { CurrencyAmount, Price, Token } from '@uniswap/sdk-core'
import { PositionInfo } from './positions'
import { Position, Pool, nearestUsableTick } from '@uniswap/v3-sdk'
import { getPoolInfo } from './pool'

export async function executeTakeProfitOrder(
  targetPrice: Price<Token, Token>,
  tokenAmountIn: CurrencyAmount<Token>,
  pool: Pool
): Promise<void> {}

export async function createTakeProfitOrderPosition() {}

async function constructRangeOrderPosition(
  token0Amount: CurrencyAmount<Token>,
  token1Amount: CurrencyAmount<Token>,
  tickBoundary: number,
  zeroForOne: boolean
): Promise<Position> {
  // get pool info
  const poolInfo = await getPoolInfo()

  // construct pool instance
  const configuredPool = new Pool(
    token0Amount.currency,
    token1Amount.currency,
    poolInfo.fee,
    poolInfo.sqrtPriceX96.toString(),
    poolInfo.liquidity.toString(),
    poolInfo.tick
  )

  if (zeroForOne) {
    // Create position from one tick above current tick to boundary
    return Position.fromAmounts({
      pool: configuredPool,
      tickLower:
        nearestUsableTick(poolInfo.tick, poolInfo.tickSpacing) +
        poolInfo.tickSpacing,
      tickUpper: tickBoundary,
      amount0: token0Amount.quotient,
      amount1: token1Amount.quotient,
      useFullPrecision: true,
    })
  } else {
    // Create position from one tick below the current tick to boundary
    return Position.fromAmounts({
      pool: configuredPool,
      tickLower: tickBoundary,
      tickUpper:
        nearestUsableTick(poolInfo.tick, poolInfo.tickSpacing) -
        poolInfo.tickSpacing,
      amount0: token0Amount.quotient,
      amount1: token1Amount.quotient,
      useFullPrecision: true,
    })
  }
}
