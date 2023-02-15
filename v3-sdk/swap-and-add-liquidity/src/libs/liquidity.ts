import { BigNumber, ethers } from 'ethers'
import {
  ERC20_ABI,
  NONFUNGIBLE_POSITION_MANAGER_ABI,
  MAX_FEE_PER_GAS,
  MAX_PRIORITY_FEE_PER_GAS,
  NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
  V3_SWAP_ROUTER_ADDRESS,
} from './constants'
import { TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER } from './constants'
import {
  getMainnetProvider,
  sendTransaction,
  TransactionState,
} from './providers'
import {
  Pool,
  Position,
  nearestUsableTick,
  NonfungiblePositionManager,
  MintOptions,
} from '@uniswap/v3-sdk'
import { CurrentConfig } from '../config'
import { getPoolInfo } from './pool'
import { getProvider, getWalletAddress } from './providers'
import { Percent, CurrencyAmount, Token, Fraction } from '@uniswap/sdk-core'
import { fromReadableAmount } from './conversion'
import {
  AlphaRouter,
  SwapAndAddConfig,
  SwapAndAddOptions,
  SwapToRatioResponse,
  SwapToRatioRoute,
  SwapToRatioStatus,
  SwapType,
} from '@uniswap/smart-order-router'

export interface PositionInfo {
  tickLower: number
  tickUpper: number
  liquidity: BigNumber
  feeGrowthInside0LastX128: BigNumber
  feeGrowthInside1LastX128: BigNumber
  tokensOwed0: BigNumber
  tokensOwed1: BigNumber
}

export async function swapAndAddLiquidity(
  positionId: number
): Promise<TransactionState> {
  const address = getWalletAddress()
  const provider = getProvider()
  if (!address || !provider) {
    return TransactionState.Failed
  }

  // Give approval to the router contract to transfer tokens
  const tokenInApproval = await getTokenTransferApproval(
    CurrentConfig.tokens.token0,
    V3_SWAP_ROUTER_ADDRESS
  )

  const tokenOutApproval = await getTokenTransferApproval(
    CurrentConfig.tokens.token1,
    V3_SWAP_ROUTER_ADDRESS
  )

  // Fail if transfer approvals are not granted
  if (
    tokenInApproval !== TransactionState.Sent ||
    tokenOutApproval !== TransactionState.Sent
  ) {
    return TransactionState.Failed
  }

  const router = new AlphaRouter({ chainId: 1, provider: getMainnetProvider() })

  const token0CurrencyAmount = CurrencyAmount.fromRawAmount(
    CurrentConfig.tokens.token0,
    fromReadableAmount(
      CurrentConfig.tokens.token0AmountToAdd,
      CurrentConfig.tokens.token0.decimals
    )
  )

  const token1CurrencyAmount = CurrencyAmount.fromRawAmount(
    CurrentConfig.tokens.token1,
    fromReadableAmount(
      CurrentConfig.tokens.token1AmountToAdd,
      CurrentConfig.tokens.token1.decimals
    )
  )

  const currentPosition = await constructPositionWithPlaceholderLiquidity(
    CurrentConfig.tokens.token0,
    CurrentConfig.tokens.token1
  )

  const swapAndAddConfig: SwapAndAddConfig = {
    ratioErrorTolerance: new Fraction(1, 100),
    maxIterations: 6,
  }

  const swapAndAddOptions: SwapAndAddOptions = {
    swapOptions: {
      type: SwapType.SWAP_ROUTER_02,
      recipient: address,
      slippageTolerance: new Percent(50, 10_000),
      deadline: Math.floor(Date.now() / 1000) + 60 * 20,
    },
    addLiquidityOptions: {
      tokenId: positionId,
    },
  }

  const routeToRatioResponse: SwapToRatioResponse = await router.routeToRatio(
    token0CurrencyAmount,
    token1CurrencyAmount,
    currentPosition,
    swapAndAddConfig,
    swapAndAddOptions
  )

  if (
    !routeToRatioResponse ||
    routeToRatioResponse.status !== SwapToRatioStatus.SUCCESS
  ) {
    return TransactionState.Failed
  }

  const route: SwapToRatioRoute = routeToRatioResponse.result
  const transaction = {
    data: route.methodParameters?.calldata,
    to: V3_SWAP_ROUTER_ADDRESS,
    value: route.methodParameters?.value,
    from: address,
  }

  return sendTransaction(transaction)
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

export async function getPositionInfo(tokenId: number): Promise<PositionInfo> {
  const provider = getProvider()

  if (!provider) {
    throw new Error('No provider available')
  }

  const positionContract = new ethers.Contract(
    NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
    NONFUNGIBLE_POSITION_MANAGER_ABI,
    provider
  )

  const position = await positionContract.positions(tokenId)

  return {
    tickLower: position.tickLower,
    tickUpper: position.tickUpper,
    liquidity: position.liquidity,
    feeGrowthInside0LastX128: position.feeGrowthInside0LastX128,
    feeGrowthInside1LastX128: position.feeGrowthInside1LastX128,
    tokensOwed0: position.tokensOwed0,
    tokensOwed1: position.tokensOwed1,
  }
}

export async function getTokenTransferApproval(
  token: Token,
  spenderAddress: string
): Promise<TransactionState> {
  const provider = getProvider()
  const address = getWalletAddress()
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
      spenderAddress,
      TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER
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

export async function constructPosition(
  token0Amount: CurrencyAmount<Token>,
  token1Amount: CurrencyAmount<Token>
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

  // create position using the maximum liquidity from input amounts
  return Position.fromAmounts({
    pool: configuredPool,
    tickLower:
      nearestUsableTick(poolInfo.tick, poolInfo.tickSpacing) -
      poolInfo.tickSpacing * 2,
    tickUpper:
      nearestUsableTick(poolInfo.tick, poolInfo.tickSpacing) +
      poolInfo.tickSpacing * 2,
    amount0: token0Amount.quotient,
    amount1: token1Amount.quotient,
    useFullPrecision: true,
  })
}

export async function constructPositionWithPlaceholderLiquidity(
  token0: Token,
  token1: Token
): Promise<Position> {
  // get pool info
  const poolInfo = await getPoolInfo()

  // construct pool instance
  const configuredPool = new Pool(
    token0,
    token1,
    poolInfo.fee,
    poolInfo.sqrtPriceX96.toString(),
    poolInfo.liquidity.toString(),
    poolInfo.tick
  )

  // create position using the maximum liquidity from input amounts
  return new Position({
    pool: configuredPool,
    tickLower:
      nearestUsableTick(poolInfo.tick, poolInfo.tickSpacing) -
      poolInfo.tickSpacing * 2,
    tickUpper:
      nearestUsableTick(poolInfo.tick, poolInfo.tickSpacing) +
      poolInfo.tickSpacing * 2,
    liquidity: 1,
  })
}

export async function mintPosition(): Promise<TransactionState> {
  const address = getWalletAddress()
  const provider = getProvider()

  if (!address || !provider) {
    return TransactionState.Failed
  }

  // Give approval to the Position Manager contract to transfer tokens
  const tokenInApproval = await getTokenTransferApproval(
    CurrentConfig.tokens.token0,
    NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS
  )
  const tokenOutApproval = await getTokenTransferApproval(
    CurrentConfig.tokens.token1,
    NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS
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
    CurrencyAmount.fromRawAmount(
      CurrentConfig.tokens.token1,
      fromReadableAmount(
        CurrentConfig.tokens.token1Amount,
        CurrentConfig.tokens.token1.decimals
      )
    )
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
