import { ethers } from 'ethers'
import { ERC20_ABI, NONFUNGIBLE_POSITION_MANAGER_ABI } from './constants'
import { AMOUNT_TO_APPROVE } from './constants'
import { sendTransaction, TransactionState } from './providers'
import { Pool, Position, nearestUsableTick } from '@uniswap/v3-sdk'
import { fromReadableAmount } from '../libs/conversion'
import { CurrentConfig } from '../config'
import { getPoolInfo } from './pool'

export async function getPositionIds(
  provider: ethers.providers.Provider,
  address: string,
  contractAddress: string
): Promise<number[]> {
  // Get currency otherwise
  const positionContract = new ethers.Contract(
    contractAddress,
    NONFUNGIBLE_POSITION_MANAGER_ABI,
    provider
  )
  // Get number of positions
  const balance: number = await positionContract.balanceOf(address)

  // Get all positions
  const tokenIds = []
  for (let i = 0; i < balance; i++) {
    const tokenOfOwnerByIndex: number =
      await positionContract.tokenOfOwnerByIndex(address, i)
    tokenIds.push(tokenOfOwnerByIndex)
  }

  return tokenIds
}

export async function getTokenTransferApprovals(
  provider: ethers.providers.Provider,
  tokenAddress: string,
  fromAddress: string,
  toAddress: string
): Promise<TransactionState> {
  if (!provider) {
    console.log('No Provider Found')
    return TransactionState.Failed
  }

  try {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)

    const transaction = await tokenContract.populateTransaction.approve(
      toAddress,
      AMOUNT_TO_APPROVE
    )

    await sendTransaction({
      ...transaction,
      from: fromAddress,
    })
  } catch (e) {
    console.error(e)
    return TransactionState.Failed
  }

  return TransactionState.Sent
}

export const getPosition = async (
  percentageToIncrease?: number
): Promise<Position> => {
  // get pool info
  const poolInfo = await getPoolInfo()

  // construct pool instance
  const USDC_DAI_POOL = new Pool(
    CurrentConfig.tokens.token0,
    CurrentConfig.tokens.token1,
    poolInfo.fee,
    poolInfo.sqrtPriceX96.toString(),
    poolInfo.liquidity.toString(),
    poolInfo.tick
  )

  let amount0 = fromReadableAmount(
    CurrentConfig.tokens.token0Amount,
    CurrentConfig.tokens.token0.decimals
  )
  let amount1 = fromReadableAmount(
    CurrentConfig.tokens.token1Amount,
    CurrentConfig.tokens.token1.decimals
  )

  if (percentageToIncrease) {
    amount0 = (amount0 * percentageToIncrease) / 100
    amount1 = (amount1 * percentageToIncrease) / 100
  }

  // create position using the maximum liquidity from input amounts
  return Position.fromAmounts({
    pool: USDC_DAI_POOL,
    tickLower:
      nearestUsableTick(poolInfo.tick, poolInfo.tickSpacing) -
      poolInfo.tickSpacing * 2,
    tickUpper:
      nearestUsableTick(poolInfo.tick, poolInfo.tickSpacing) +
      poolInfo.tickSpacing * 2,
    amount0,
    amount1,
    useFullPrecision: true,
  })
}
