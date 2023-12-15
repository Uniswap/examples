import {
  MAX_FEE_PER_GAS,
  MAX_PRIORITY_FEE_PER_GAS,
  V3_SWAP_ROUTER_ADDRESS,
} from './constants'
import { TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER } from './constants'
import {
  getMainnetProvider,
  getWallet,
  sendTransaction,
  TransactionState,
} from './providers'
import {
  Position,
  nearestUsableTick,
  NonfungiblePositionManager,
  MintOptions,
  approveTokenTransfer,
} from '@uniswap/v3-sdk'
import { CurrentConfig } from '../config'
import { getPool } from './pool'
import { getProvider, getWalletAddress } from './providers'
import {
  Percent,
  CurrencyAmount,
  Token,
  Fraction,
  NONFUNGIBLE_POSITION_MANAGER_ADDRESSES,
} from '@uniswap/sdk-core'
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

export async function swapAndAddLiquidity(
  positionId: bigint
): Promise<TransactionState> {
  const address = getWalletAddress()
  const provider = getProvider()
  if (!address || !provider) {
    return TransactionState.Failed
  }

  // Give approval to the router contract to transfer tokens
  const tokenInApproval = await getTokenTransferApproval(
    V3_SWAP_ROUTER_ADDRESS,
    CurrentConfig.tokens.token0,
    TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER
  )

  const tokenOutApproval = await getTokenTransferApproval(
    V3_SWAP_ROUTER_ADDRESS,
    CurrentConfig.tokens.token1,
    TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER
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

  const currentPosition = await constructPositionWithPlaceholderLiquidity()

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

export async function getPositions(): Promise<Position[]> {
  const provider = getProvider()
  const address = getWalletAddress()

  if (!provider || !address) {
    throw new Error('No provider available')
  }
  // Get all positions
  return Position.getAllPositionsForAddress(provider, address)
}

export async function getTokenTransferApproval(
  contractAddress: string,
  token: Token,
  rawAmount: bigint
): Promise<TransactionState> {
  const provider = getProvider()
  const address = getWalletAddress()
  if (!provider || !address) {
    console.log('No Provider Found')
    return TransactionState.Failed
  }

  const receipt = await approveTokenTransfer(
    contractAddress,
    token.address,
    rawAmount,
    getWallet()
  )
  if (receipt) {
    return TransactionState.Sent
  } else {
    return TransactionState.Failed
  }
}

export async function constructPosition(
  token0Amount: CurrencyAmount<Token>,
  token1Amount: CurrencyAmount<Token>
): Promise<Position> {
  // get pool info
  const pool = await getPool()

  // create position using the maximum liquidity from input amounts
  return Position.fromAmounts({
    pool,
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

export async function constructPositionWithPlaceholderLiquidity(): Promise<Position> {
  // get pool info
  const pool = await getPool()

  // create position using the maximum liquidity from input amounts
  return new Position({
    pool,
    tickLower:
      nearestUsableTick(pool.tickCurrent, pool.tickSpacing) -
      pool.tickSpacing * 2,
    tickUpper:
      nearestUsableTick(pool.tickCurrent, pool.tickSpacing) +
      pool.tickSpacing * 2,
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
    NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[CurrentConfig.tokens.token0.chainId],
    CurrentConfig.tokens.token0,
    TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER
  )
  const tokenOutApproval = await getTokenTransferApproval(
    NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[CurrentConfig.tokens.token1.chainId],
    CurrentConfig.tokens.token1,
    TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER
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
    to: NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[
      CurrentConfig.tokens.token0.chainId
    ],
    value: value,
    from: address,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
  }

  return sendTransaction(transaction)
}
