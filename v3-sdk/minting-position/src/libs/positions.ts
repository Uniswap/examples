import {
  NONFUNGIBLE_POSITION_MANAGER_ADDRESSES,
  Percent,
} from '@uniswap/sdk-core'
import {
  approveTokenTransfer,
  MintOptions,
  nearestUsableTick,
  Position,
} from '@uniswap/v3-sdk'
import { CurrentConfig } from '../config'
import { fromReadableAmount } from './conversion'
import { getPool } from './pool'
import {
  getProvider,
  getWallet,
  getWalletAddress,
  TransactionState,
  waitForReceipt,
} from './providers'

export async function mintPosition(): Promise<TransactionState> {
  const address = getWalletAddress()
  const provider = getProvider()
  if (!address || !provider) {
    return TransactionState.Failed
  }

  // Give approval to the contract to transfer tokens
  const positionManagerAddress =
    NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[CurrentConfig.tokens.token0.chainId]

  const amount0 = fromReadableAmount(
    CurrentConfig.tokens.token0Amount,
    CurrentConfig.tokens.token0.decimals
  )
  const amount1 = fromReadableAmount(
    CurrentConfig.tokens.token1Amount,
    CurrentConfig.tokens.token1.decimals
  )

  const token0Approval = await approveTokenTransfer({
    contractAddress: positionManagerAddress,
    tokenAddress: CurrentConfig.tokens.token0.address,
    amount: amount0,
    signer: getWallet(),
  })
  const token1Approval = await approveTokenTransfer({
    contractAddress: positionManagerAddress,
    tokenAddress: CurrentConfig.tokens.token1.address,
    amount: amount1,
    signer: getWallet(),
  })
  // Fail if transfer approvals do not go through
  if (token0Approval.status !== 1 || token1Approval.status !== 1) {
    return TransactionState.Failed
  }

  const pool = await getPool()

  const positionToMint = Position.fromAmounts({
    pool: pool,
    tickLower:
      nearestUsableTick(pool.tickCurrent, pool.tickSpacing) -
      pool.tickSpacing * 2,
    tickUpper:
      nearestUsableTick(pool.tickCurrent, pool.tickSpacing) +
      pool.tickSpacing * 2,
    amount0: amount0,
    amount1: amount1,
    useFullPrecision: true,
  })

  const mintOptions: MintOptions = {
    recipient: address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 20,
    slippageTolerance: new Percent(50, 10_000),
  }

  // get calldata for minting a position
  const txResponse = await positionToMint.mint({
    signer: getWallet(),
    provider,
    options: mintOptions,
  })

  return waitForReceipt(txResponse)
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
