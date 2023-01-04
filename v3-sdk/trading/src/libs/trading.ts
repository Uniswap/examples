import {
  Currency,
  CurrencyAmount,
  Percent,
  Token,
  TradeType,
} from '@uniswap/sdk-core'
import {
  Pool,
  Route,
  SwapOptions,
  SwapQuoter,
  SwapRouter,
  Trade,
} from '@uniswap/v3-sdk'
import { ethers } from 'ethers'
import JSBI from 'jsbi'

import { CurrentConfig } from '../config'
import {
  AMOUNT_TO_APPROVE,
  ERC20_ABI,
  QUOTER_CONTRACT_ADDRESS,
  SWAP_ROUTER_ADDRESS,
} from './constants'
import { MAX_FEE_PER_GAS, MAX_PRIORITY_FEE_PER_GAS } from './constants'
import { getPoolInfo } from './pool'
import {
  getProvider,
  getWalletAddress,
  sendTransaction,
  TransactionState,
} from './providers'
import { fromReadableAmount } from './utils'

export type TokenTrade = Trade<Token, Token, TradeType>

// Trading Functions

export async function createTrade(): Promise<TokenTrade> {
  const poolInfo = await getPoolInfo()

  const pool = new Pool(
    CurrentConfig.tokens.in,
    CurrentConfig.tokens.out,
    CurrentConfig.tokens.poolFee,
    poolInfo.sqrtPriceX96.toString(),
    poolInfo.liquidity.toString(),
    poolInfo.tick
  )

  const swapRoute = new Route(
    [pool],
    CurrentConfig.tokens.in,
    CurrentConfig.tokens.out
  )

  const provider = getProvider()
  if (!provider) {
    throw new Error()
  }

  const amountOut = await getOutputQuote(swapRoute)
  console.log('Amount Out', amountOut)

  const uncheckedTrade = Trade.createUncheckedTrade({
    route: swapRoute,
    inputAmount: CurrencyAmount.fromRawAmount(
      CurrentConfig.tokens.in,
      fromReadableAmount(
        CurrentConfig.tokens.amountIn,
        CurrentConfig.tokens.in.decimals
      ).toString()
    ),
    outputAmount: CurrencyAmount.fromRawAmount(
      CurrentConfig.tokens.out,
      JSBI.BigInt(amountOut)
    ),
    tradeType: TradeType.EXACT_INPUT,
  })

  console.log('Unchecked Trade', uncheckedTrade)

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
    slippageTolerance: new Percent(500, 10000), // 50 bips, or 0.50%
    deadline: Math.floor(Date.now() / 1000) + 60 * 30, // 20 minutes from the current Unix time
    recipient: walletAddress,
  }

  const methodParameters = SwapRouter.swapCallParameters([trade], options)

  const tokenApproval = await getTokenTransferApprovals(
    provider,
    CurrentConfig.tokens.in.address,
    walletAddress
  )

  // Fail if transfer approvals do not go through
  if (tokenApproval !== TransactionState.Sent) {
    return TransactionState.Failed
  }

  const tx = {
    data: methodParameters.calldata,
    to: SWAP_ROUTER_ADDRESS,
    value: methodParameters.value,
    from: walletAddress,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
  }

  const res = await sendTransaction(tx)

  return res
}

// Helper Quoting and Pool Functions

async function getOutputQuote(route: Route<Currency, Currency>) {
  const provider = getProvider()

  if (!provider) {
    throw new Error('Provider required to get pool state')
  }

  const { calldata } = await SwapQuoter.quoteCallParameters(
    route,
    CurrencyAmount.fromRawAmount(
      CurrentConfig.tokens.in,
      fromReadableAmount(
        CurrentConfig.tokens.amountIn,
        CurrentConfig.tokens.in.decimals
      )
    ),
    TradeType.EXACT_INPUT,
    {
      useQuoterV2: true,
    }
  )

  const quoteCallReturnData = await provider.call({
    to: QUOTER_CONTRACT_ADDRESS,
    data: calldata,
  })

  return ethers.utils.defaultAbiCoder.decode(['uint256'], quoteCallReturnData)
}

export async function getTokenTransferApprovals(
  provider: ethers.providers.Provider,
  tokenAddress: string,
  fromAddress: string
): Promise<TransactionState> {
  if (!provider) {
    console.log('No Provider Found')
    return TransactionState.Failed
  }

  try {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)

    const transaction = await tokenContract.populateTransaction.approve(
      SWAP_ROUTER_ADDRESS,
      JSBI.BigInt(AMOUNT_TO_APPROVE).toString()
    )

    const tx = sendTransaction({
      ...transaction,
      from: fromAddress,
    })

    return tx
  } catch (e) {
    console.error(e)
    return TransactionState.Failed
  }
}
