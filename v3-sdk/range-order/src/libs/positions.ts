import { CurrencyAmount, Percent, Token } from '@uniswap/sdk-core'
import {
  MintOptions,
  nearestUsableTick,
  NonfungiblePositionManager,
  Pool,
  Position,
} from '@uniswap/v3-sdk'
import { CurrentConfig } from '../config'
import {
  ERC20_ABI,
  MAX_FEE_PER_GAS,
  MAX_PRIORITY_FEE_PER_GAS,
  NONFUNGIBLE_POSITION_MANAGER_ABI,
  NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
} from './constants'
import { fromReadableAmount } from './conversion'
import {
  getProvider,
  getWalletAddress,
  sendTransaction,
  TransactionState,
} from './providers'
import { CollectOptions, RemoveLiquidityOptions } from '@uniswap/v3-sdk'
import { ethers } from 'ethers'

export async function mintPosition(): Promise<TransactionState> {
  const address = getWalletAddress()
  const provider = getProvider()
  if (!address || !provider) {
    return TransactionState.Failed
  }

  const amount0 = BigInt(CurrentConfig.tokens.token0Amount)
  const amount1 = BigInt(CurrentConfig.tokens.token1Amount)

  // Give approval to the contract to transfer tokens
  const tokenInApproval = await getTokenTransferApproval(
    NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
    CurrentConfig.tokens.token0,
    address,
    amount0
  )
  const tokenOutApproval = await getTokenTransferApproval(
    NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
    CurrentConfig.tokens.token1,
    address,
    amount1
  )

  // Fail if transfer approvals do not go through
  if (
    tokenInApproval !== TransactionState.Sent ||
    tokenOutApproval !== TransactionState.Sent
  ) {
    return TransactionState.Failed
  }

  const positionToMint = await constructPosition(
    CurrencyAmount.fromRawAmount(
      CurrentConfig.tokens.token0,
      fromReadableAmount(
        CurrentConfig.tokens.token0Amount,
        CurrentConfig.tokens.token0.decimals
      )
    ),
    CurrencyAmount.fromRawAmount(CurrentConfig.tokens.token1, 0)
  )

  const mintOptions: MintOptions = {
    recipient: address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 20,
    slippageTolerance: new Percent(50, 10_000),
  }

  // get calldata for minting a position
  const { calldata, value } = NonfungiblePositionManager.addCallParameters(
    positionToMint,
    mintOptions
  )

  // build transaction
  const transaction = {
    data: calldata,
    to: NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
    value: value,
    from: address,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
  }

  return sendTransaction(transaction)
}

export async function constructPosition(
  token0Amount: CurrencyAmount<Token>,
  token1Amount: CurrencyAmount<Token>
): Promise<Position> {
  // construct pool instance
  const pool = await Pool.initFromChain(
    getProvider(),
    token0Amount.currency,
    token1Amount.currency,
    CurrentConfig.tokens.poolFee
  )

  // create position using the maximum liquidity from input amounts
  return Position.fromAmounts({
    pool: pool,
    tickLower:
      nearestUsableTick(pool.tickCurrent, pool.tickSpacing) -
      pool.tickSpacing * 2,
    tickUpper:
      nearestUsableTick(pool.tickCurrent, pool.tickSpacing) +
      pool.tickSpacing * 2,
    amount0: token0Amount.quotient,
    amount1: token1Amount.quotient,
    useFullPrecision: true,
  })
}

export async function getPositionIds(): Promise<number[]> {
  const provider = getProvider()
  const address = getWalletAddress()
  if (!provider || !address) {
    throw new Error('No provider available')
  }

  const positionContract = new ethers.Contract(
    NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
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

export async function getPosition(positionId: number) {
  return Position.fetchWithPositionId(getProvider(), positionId)
}

export async function getTokenTransferApproval(
  contractAddress: string,
  token: Token,
  address: string,
  amount: bigint
): Promise<TransactionState> {
  const provider = getProvider()
  if (!provider || !address) {
    console.log('No Provider Found')
    return TransactionState.Failed
  }

  try {
    const tokenContract = new ethers.Contract(
      token.address,
      ERC20_ABI,
      provider
    )

    const transaction = await tokenContract.populateTransaction.approve(
      contractAddress,
      amount.toString()
    )

    return sendTransaction({
      ...transaction,
      from: address,
    })
  } catch (e) {
    console.error(e)
    return TransactionState.Failed
  }
}

export async function removeLiquidity(
  positionId: number,
  currentPosition: Position
): Promise<TransactionState> {
  const address = getWalletAddress()
  const provider = getProvider()
  if (!address || !provider) {
    return TransactionState.Failed
  }

  const collectOptions: Omit<CollectOptions, 'tokenId'> = {
    expectedCurrencyOwed0: CurrencyAmount.fromRawAmount(
      CurrentConfig.tokens.token0,
      0
    ),
    expectedCurrencyOwed1: CurrencyAmount.fromRawAmount(
      CurrentConfig.tokens.token1,
      0
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
  // get calldata for minting a position
  const { calldata, value } = NonfungiblePositionManager.removeCallParameters(
    currentPosition,
    removeLiquidityOptions
  )

  // build transaction
  const transaction = {
    data: calldata,
    to: NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
    value: value,
    from: address,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
  }

  return sendTransaction(transaction)
}
