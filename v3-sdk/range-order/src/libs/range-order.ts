import {
  CurrencyAmount,
  Fraction,
  Percent,
  Price,
  Token,
} from '@uniswap/sdk-core'
import {
  Position,
  Pool,
  nearestUsableTick,
  priceToClosestTick,
  NonfungiblePositionManager,
  MintOptions,
  CollectOptions,
  RemoveLiquidityOptions,
  tickToPrice,
} from '@uniswap/v3-sdk'
import { getPrice } from './pool'
import { CurrentConfig } from '../config'
import { fromReadableAmount } from './conversion'
import {
  MAX_FEE_PER_GAS,
  MAX_PRIORITY_FEE_PER_GAS,
  NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
} from './constants'
import {
  TransactionState,
  getProvider,
  getWallet,
  getWalletAddress,
  sendTransaction,
} from './providers'
import { getTokenTransferApproval } from './positions'
import { ethers } from 'ethers'

export interface TakeProfitOrder {
  targetTick: number
  targetPrice: Price<Token, Token>
  position: Position
  zeroForOne: boolean
}

export async function watchTakeProfitOrder(
  positionId: number,
  order: TakeProfitOrder
): Promise<TransactionState | void> {
  const address = getWalletAddress()
  const provider = getProvider()
  if (!address || !provider) {
    return TransactionState.Failed
  }
  const pool = await Pool.initFromChain(
    provider,
    CurrentConfig.tokens.token0,
    CurrentConfig.tokens.token1,
    CurrentConfig.tokens.poolFee
  )
  const currentPosition = await Position.fetchWithPositionId(
    provider,
    positionId
  )

  if (
    currentPosition.tokensOwed0 === undefined ||
    currentPosition.tokensOwed1 === undefined
  ) {
    throw new Error('Could not fetch owed fees')
  }

  if (currentPosition._liquidity === 0n) {
    return
  }

  if (
    order.zeroForOne
      ? pool.tickCurrent > currentPosition.tickUpper
      : pool.tickCurrent < currentPosition.tickLower
  ) {
    const collectOptions: Omit<CollectOptions, 'tokenId'> = {
      expectedCurrencyOwed0: CurrencyAmount.fromRawAmount(
        CurrentConfig.tokens.token0,
        currentPosition.tokensOwed0
      ),
      expectedCurrencyOwed1: CurrencyAmount.fromRawAmount(
        CurrentConfig.tokens.token1,
        currentPosition.tokensOwed1
      ),
      recipient: address,
    }
    const removeLiquidityOptions: RemoveLiquidityOptions = {
      deadline: Math.floor(Date.now() / 1000) + 60 * 20,
      slippageTolerance: new Percent(50, 10_000),
      tokenId: positionId,
      // percentage of liquidity to remove
      liquidityPercentage: new Percent(1),
      collectOptions,
    }

    const { calldata, value } = NonfungiblePositionManager.removeCallParameters(
      currentPosition,
      removeLiquidityOptions
    )
    const transaction = {
      data: calldata,
      to: NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
      value: value,
      from: address,
      maxFeePerGas: MAX_FEE_PER_GAS,
      maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
      gasLimit: '1000000',
    }

    return sendTransaction(transaction)
  } else {
    return
  }
}

export async function mintTakeProfitOrder(
  order: TakeProfitOrder
): Promise<number | void> {
  const address = getWalletAddress()
  const provider = getProvider()
  if (!address || !provider) {
    return
  }

  const { amount0, amount1 } = order.position.mintAmounts

  // Give approval to the contract to transfer tokens
  const tokenInApproval = await getTokenTransferApproval(
    NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
    CurrentConfig.tokens.token0,
    address,
    BigInt(amount0.toString())
  )
  const tokenOutApproval = await getTokenTransferApproval(
    NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
    CurrentConfig.tokens.token1,
    address,
    BigInt(amount1.toString())
  )

  // Fail if transfer approvals do not go through
  if (
    tokenInApproval !== TransactionState.Sent ||
    tokenOutApproval !== TransactionState.Sent
  ) {
    return
  }

  const mintOptions: MintOptions = {
    recipient: address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 20,
    slippageTolerance: new Percent(50, 10_000),
  }

  // get calldata for minting a position
  const { calldata, value } = NonfungiblePositionManager.addCallParameters(
    order.position,
    mintOptions
  )

  //build transaction
  const transaction = {
    data: calldata,
    to: NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
    value: ethers.BigNumber.from(value),
    from: address,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
    gasLimit: '1000000',
  }

  const txRes = await getWallet().call(transaction)
  const decodedRes = ethers.utils.defaultAbiCoder.decode(
    ['tuple(uint256, uint128, uint256, uint256)'],
    txRes
  )[0]
  await sendTransaction(transaction)

  return decodedRes[0].toNumber()
}

export async function constructTakeProfitOrder(
  zeroForOne: boolean,
  amount: number
): Promise<TakeProfitOrder> {
  const configuredPool = await Pool.initFromChain(
    getProvider(),
    CurrentConfig.tokens.token0,
    CurrentConfig.tokens.token1,
    CurrentConfig.tokens.poolFee
  )

  const current = await getPrice()
  const priceTarget = zeroForOne
    ? new Price(
        current.baseCurrency,
        current.quoteCurrency,
        current.asFraction.multiply(
          new Fraction(100 + CurrentConfig.targetPercentageUp, 100)
        ).denominator,
        current.asFraction.multiply(
          new Fraction(100 + CurrentConfig.targetPercentageUp, 100)
        ).numerator
      )
    : new Price(
        current.baseCurrency,
        current.quoteCurrency,
        current.asFraction.divide(
          new Fraction(100 + CurrentConfig.targetPercentageUp, 100)
        ).denominator,
        current.asFraction.divide(
          new Fraction(100 + CurrentConfig.targetPercentageUp, 100)
        ).numerator
      )
  const targetTick = nearestUsableTick(
    priceToClosestTick(priceTarget),
    configuredPool.tickSpacing
  )
  const amount0 = zeroForOne
    ? CurrencyAmount.fromRawAmount(
        CurrentConfig.tokens.token0,
        fromReadableAmount(amount, CurrentConfig.tokens.token0.decimals)
      )
    : CurrencyAmount.fromRawAmount(CurrentConfig.tokens.token0, 0)
  const amount1 = zeroForOne
    ? CurrencyAmount.fromRawAmount(CurrentConfig.tokens.token1, 0)
    : CurrencyAmount.fromRawAmount(
        CurrentConfig.tokens.token1,
        fromReadableAmount(amount, CurrentConfig.tokens.token1.decimals)
      )

  const position = await constructRangeOrderPosition(
    amount0,
    amount1,
    targetTick,
    configuredPool,
    zeroForOne
  )
  const closestTargetPrice = tickToPrice(
    position.amount0.currency,
    position.amount1.currency,
    targetTick
  )

  return {
    targetTick,
    targetPrice: closestTargetPrice,
    position,
    zeroForOne,
  }
}

async function constructRangeOrderPosition(
  token0Amount: CurrencyAmount<Token>,
  token1Amount: CurrencyAmount<Token>,
  tickBoundary: number,
  pool: Pool,
  zeroForOne: boolean
): Promise<Position> {
  if (zeroForOne) {
    // Create position from next tick above or one tick above current tick to boundary tick
    let tickUpper = tickBoundary
    let tickLower = tickUpper - pool.tickSpacing

    if (tickLower <= pool.tickCurrent) {
      tickLower += pool.tickSpacing
      tickUpper += pool.tickSpacing
    }

    return Position.fromAmounts({
      pool: pool,
      tickLower: tickLower,
      tickUpper: tickUpper,
      amount0: token0Amount.quotientBigInt,
      amount1: token1Amount.quotientBigInt,
      useFullPrecision: true,
    })
  } else {
    // Create position from next tick below or one tick below the current tick to boundary tick
    let tickLower = tickBoundary
    let tickUpper = tickLower + pool.tickSpacing
    if (tickUpper > pool.tickCurrent) {
      tickUpper -= pool.tickSpacing
    }

    if (tickLower >= tickUpper) {
      tickLower = tickUpper -= pool.tickSpacing
    }

    return Position.fromAmounts({
      pool: pool,
      tickLower: tickLower,
      tickUpper: tickUpper,
      amount0: token0Amount.quotient,
      amount1: token1Amount.quotient,
      useFullPrecision: true,
    })
  }
}
