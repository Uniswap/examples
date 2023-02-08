import {
  AlphaRouter,
  ChainId,
  SwapOptionsSwapRouter02,
  SwapRoute,
  SwapType,
} from '@uniswap/smart-order-router'
import { TradeType, CurrencyAmount, Percent, Token } from '@uniswap/sdk-core'
import { CurrentConfig } from '../config'
import {
  getMainnetProvider,
  getWalletAddress,
  sendTransaction,
  TransactionState,
  getProvider,
} from './providers'
import {
  MAX_FEE_PER_GAS,
  MAX_PRIORITY_FEE_PER_GAS,
  ERC20_ABI,
  TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER,
  V3_SWAP_ROUTER_ADDRESS,
} from './constants'
import { fromReadableAmount } from './conversion'
import { ethers } from 'ethers'

export async function generateRoute(): Promise<SwapRoute | null> {
  const router = new AlphaRouter({
    chainId: ChainId.MAINNET,
    provider: getMainnetProvider(),
  })

  const options: SwapOptionsSwapRouter02 = {
    recipient: CurrentConfig.wallet.address,
    slippageTolerance: new Percent(50, 10_000),
    deadline: Math.floor(Date.now() / 1000 + 1800),
    type: SwapType.SWAP_ROUTER_02,
  }

  const route = await router.route(
    CurrencyAmount.fromRawAmount(
      CurrentConfig.tokens.in,
      fromReadableAmount(
        CurrentConfig.tokens.amountIn,
        CurrentConfig.tokens.in.decimals
      ).toString()
    ),
    CurrentConfig.tokens.out,
    TradeType.EXACT_INPUT,
    options
  )

  return route
}

export async function executeRoute(
  route: SwapRoute
): Promise<TransactionState> {
  const walletAddress = getWalletAddress()
  const provider = getProvider()

  if (!walletAddress || !provider) {
    throw new Error('Cannot execute a trade without a connected wallet')
  }

  const tokenApproval = await getTokenTransferApproval(CurrentConfig.tokens.in)

  // Fail if transfer approvals do not go through
  if (tokenApproval !== TransactionState.Sent) {
    return TransactionState.Failed
  }

  const res = await sendTransaction({
    data: route.methodParameters?.calldata,
    to: V3_SWAP_ROUTER_ADDRESS,
    value: route?.methodParameters?.value,
    from: walletAddress,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
  })

  return res
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

  try {
    const tokenContract = new ethers.Contract(
      token.address,
      ERC20_ABI,
      provider
    )

    const transaction = await tokenContract.populateTransaction.approve(
      V3_SWAP_ROUTER_ADDRESS,
      fromReadableAmount(
        TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER,
        token.decimals
      ).toString()
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
