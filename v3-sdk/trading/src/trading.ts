import {
  BigintIsh,
  CurrencyAmount,
  Percent,
  Token,
  TradeType,
} from '@uniswap/sdk-core'
import {
  computePoolAddress,
  Pool,
  Route,
  SwapOptions,
  SwapRouter,
  Trade,
} from '@uniswap/v3-sdk'
import { ethers } from 'ethers'
import { CurrentConfig } from './config'
import {
  MAX_FEE_PER_GAS,
  MAX_PRIORITY_FEE_PER_GAS,
  POOL_FACTORY_CONTRACT_ADDRESS,
  QUOTER_CONTRACT_ADDRESS,
  V3_SWAP_ROUTER_ADDRESS,
} from './libs/constants'
import {
  getProvider,
  getWalletAddress,
  sendTransaction,
  TransactionState,
} from './libs/providers'
import { fromReadableAmount } from './libs/utils'

import Quoter from '@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json'
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'

export type TokenTrade = Trade<Token, Token, TradeType>

// Trading Functions

export async function createTrade(): Promise<TokenTrade> {
  const poolInfo = await getPoolInfo()
  const pool = new Pool(
    CurrentConfig.tokens.in,
    CurrentConfig.tokens.out,
    CurrentConfig.tokens.fee,
    poolInfo.sqrtPriceX96,
    poolInfo.liquidity,
    poolInfo.tick
  )

  const swapRoute = new Route(
    [pool],
    CurrentConfig.tokens.in,
    CurrentConfig.tokens.out
  )

  const amountOut = await quote()

  const x = fromReadableAmount(
    CurrentConfig.tokens.amountIn,
    CurrentConfig.tokens.in.decimals
  )

  const uncheckedTrade = Trade.createUncheckedTrade({
    route: swapRoute,
    inputAmount: CurrencyAmount.fromRawAmount(CurrentConfig.tokens.in, x),
    outputAmount: CurrencyAmount.fromRawAmount(
      CurrentConfig.tokens.out,
      amountOut
    ),
    tradeType: TradeType.EXACT_INPUT,
  })

  return uncheckedTrade
}

export async function executeTrade(
  trade: TokenTrade
): Promise<TransactionState> {
  const walletAddress = getWalletAddress()
  if (!walletAddress) {
    throw new Error('Cannot execute a trade without a connected wallet')
  }

  const options: SwapOptions = {
    slippageTolerance: new Percent(500, 10000), // 50 bips, or 0.50%
    deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from the current Unix time
    recipient: walletAddress,
  }

  const methodParameters = SwapRouter.swapCallParameters([trade], options)

  const res = await sendTransaction({
    data: methodParameters.calldata,
    to: V3_SWAP_ROUTER_ADDRESS,
    value: methodParameters.value,
    from: walletAddress,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
  })

  return res
}

// Helper Quoting and Pool Functions

async function quote(): Promise<number> {
  const provider = getProvider()

  if (!provider) {
    throw new Error('Provider required to get pool state')
  }

  const quoterContract = new ethers.Contract(
    QUOTER_CONTRACT_ADDRESS,
    Quoter.abi,
    provider
  )

  const quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(
    CurrentConfig.tokens.in.address,
    CurrentConfig.tokens.out.address,
    CurrentConfig.tokens.fee,
    fromReadableAmount(
      CurrentConfig.tokens.amountIn,
      CurrentConfig.tokens.in.decimals
    ).toString(),
    0
  )

  return quotedAmountOut
}

async function getPoolInfo(): Promise<{
  liquidity: BigintIsh
  sqrtPriceX96: BigintIsh
  tick: number
}> {
  const provider = getProvider()

  if (!provider) {
    throw new Error('Provider required to get pool info')
  }

  const poolContract = new ethers.Contract(
    getPoolAddress(),
    IUniswapV3PoolABI.abi,
    provider
  )

  const [liquidity, slot] = await Promise.all([
    poolContract.liquidity(),
    poolContract.slot0(),
  ])

  return {
    liquidity,
    sqrtPriceX96: slot[0],
    tick: slot[1],
  }
}

function getPoolAddress() {
  return computePoolAddress({
    factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
    tokenA: CurrentConfig.tokens.in,
    tokenB: CurrentConfig.tokens.out,
    fee: CurrentConfig.tokens.fee,
  })
}
