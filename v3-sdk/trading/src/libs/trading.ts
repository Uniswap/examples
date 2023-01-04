import { CurrencyAmount, Percent, Token, TradeType } from '@uniswap/sdk-core'
import { Pool, Route, SwapOptions, SwapRouter, Trade } from '@uniswap/v3-sdk'
import { ethers } from 'ethers'
import { CurrentConfig } from '../config'
import {
  MAX_FEE_PER_GAS,
  MAX_PRIORITY_FEE_PER_GAS,
  QUOTER_CONTRACT_ADDRESS,
  V3_SWAP_ROUTER_ADDRESS,
  AMOUNT_TO_APPROVE,
  ERC20_ABI,
} from './constants'
import {
  getProvider,
  getWalletAddress,
  sendTransaction,
  TransactionState,
} from './providers'

import { getPoolInfo } from './pool'
import { fromReadableAmount } from './utils'

import Quoter from '@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json'

export type TokenTrade = Trade<Token, Token, TradeType>

// Trading Functions

export async function createTrade(): Promise<TokenTrade> {
  const poolInfo = await getPoolInfo()
  console.log('poolInfo', poolInfo)

  console.log('up here')
  const pool = new Pool(
    CurrentConfig.tokens.in,
    CurrentConfig.tokens.out,
    CurrentConfig.tokens.poolFee,
    poolInfo.sqrtPriceX96.toString(),
    poolInfo.liquidity.toString(),
    poolInfo.tick
  )

  console.log('middle here')

  const swapRoute = new Route(
    [pool],
    CurrentConfig.tokens.in,
    CurrentConfig.tokens.out
  )

  const provider = getProvider()
  if (!provider) {
    throw new Error()
  }

  const foo = await provider.getCode(V3_SWAP_ROUTER_ADDRESS)
  console.log('foo', foo)

  const amountOut = await getOutputQuote()

  console.log('down here')

  const uncheckedTrade = Trade.createUncheckedTrade({
    route: swapRoute,
    inputAmount: CurrencyAmount.fromRawAmount(
      CurrentConfig.tokens.in,
      CurrentConfig.tokens.amountIn.toString()
      // fromReadableAmount(
      //   CurrentConfig.tokens.amountIn,
      //   CurrentConfig.tokens.in.decimals
      // ).toString()
    ),
    outputAmount: CurrencyAmount.fromRawAmount(
      CurrentConfig.tokens.out,
      amountOut.toString()
    ),
    tradeType: TradeType.EXACT_INPUT,
  })

  return uncheckedTrade
}

export async function executeTrade(
  trade: TokenTrade
): Promise<TransactionState> {
  const walletAddress = getWalletAddress()
  const provider = getProvider()

  if (!walletAddress || !provider) {
    throw new Error('Cannot execute a trade without a connected wallet')
  }

  const options: SwapOptions = {
    slippageTolerance: new Percent(50, 10000), // 50 bips, or 0.50%
    deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from the current Unix time
    recipient: walletAddress,
  }

  const methodParameters = SwapRouter.swapCallParameters([trade], options)

  console.log('trade', trade)

  console.log('methodParameters', methodParameters)

  const tokenApproval = await getTokenTransferApprovals(
    provider,
    CurrentConfig.tokens.in.address,
    walletAddress,
    V3_SWAP_ROUTER_ADDRESS
  )

  console.log('tokenApproval', tokenApproval)

  const tx = {
    data: methodParameters.calldata,
    to: V3_SWAP_ROUTER_ADDRESS,
    value: methodParameters.value,
    from: walletAddress,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
    // gasLimit: 30000,
  }

  const moo = await provider.estimateGas(tx)

  console.log('moo', moo)

  const res = await sendTransaction(tx)

  return res
}

// Helper Quoting and Pool Functions

async function getOutputQuote(): Promise<number> {
  const provider = getProvider()

  if (!provider) {
    throw new Error('Provider required to get pool state')
  }

  const quoterContract = new ethers.Contract(
    QUOTER_CONTRACT_ADDRESS,
    Quoter.abi,
    provider
  )

  console.log('before quoteExactInputSingle')

  const quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(
    CurrentConfig.tokens.in.address,
    CurrentConfig.tokens.out.address,
    CurrentConfig.tokens.poolFee,
    CurrentConfig.tokens.amountIn.toString(),
    // fromReadableAmount(
    //   CurrentConfig.tokens.amountIn,
    //   CurrentConfig.tokens.in
    // ).toString(),
    0
  )

  console.log('after quoteExactInputSingle')

  return quotedAmountOut
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
      AMOUNT_TO_APPROVE.toString()
    )

    return sendTransaction({
      ...transaction,
      from: fromAddress,
      // gasLimit: 30000000,
    })
  } catch (e) {
    console.error(e)
    return TransactionState.Failed
  }
}
