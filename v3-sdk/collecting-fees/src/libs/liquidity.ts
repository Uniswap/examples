import { TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER } from './constants'
import { getWallet, TransactionState, waitForReceipt } from './providers'
import {
  Pool,
  Position,
  nearestUsableTick,
  MintOptions,
  NonfungiblePositionManager,
  approveTokenTransfer,
} from '@uniswap/v3-sdk'
import { CurrentConfig } from '../config'
import { getProvider, getWalletAddress } from './providers'
import {
  Percent,
  CurrencyAmount,
  Token,
  NONFUNGIBLE_POSITION_MANAGER_ADDRESSES,
  BigintIsh,
} from '@uniswap/sdk-core'
import { fromReadableAmount } from './conversion'

export async function collectFees(
  positionId: BigintIsh
): Promise<TransactionState> {
  const address = getWalletAddress()
  const provider = getProvider()
  const wallet = getWallet()
  if (!address || !provider) {
    return TransactionState.Failed
  }

  const position = await Position.fetchWithPositionId({ provider, positionId })
  const transactionResponse = await position.collectFeesOnChain({
    signer: wallet,
    provider,
    percentage: CurrentConfig.tokens.feePercentage,
  })
  return waitForReceipt(transactionResponse)
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
  token: Token
): Promise<TransactionState> {
  const provider = getProvider()
  const address = getWalletAddress()
  if (!provider || !address) {
    console.log('No Provider Found')
    return TransactionState.Failed
  }

  const receipt = await approveTokenTransfer({
    contractAddress: NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[token.chainId],
    tokenAddress: token.address,
    amount: TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER,
    signer: getWallet(),
  })
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
  const provider = getProvider()
  if (!provider) {
    throw new Error('No Provider Found')
  }

  // construct pool instance
  const pool = await Pool.initFromChain({
    provider,
    tokenA: token0Amount.currency,
    tokenB: token1Amount.currency,
    fee: CurrentConfig.tokens.poolFee,
  })

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

export async function mintPosition(): Promise<TransactionState> {
  const address = getWalletAddress()
  const provider = getProvider()
  if (!address || !provider) {
    return TransactionState.Failed
  }
  // Give approval to the contract to transfer tokens
  const tokenInApproval = await getTokenTransferApproval(
    CurrentConfig.tokens.token0
  )
  const tokenOutApproval = await getTokenTransferApproval(
    CurrentConfig.tokens.token1
  )

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

  const txRes = await NonfungiblePositionManager.createPositionOnChain(
    getWallet(),
    provider,
    positionToMint,
    mintOptions
  )

  return waitForReceipt(txRes)
}
