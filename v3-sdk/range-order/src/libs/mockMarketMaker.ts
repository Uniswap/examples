import { Pool, Route, SwapOptions, SwapRouter, Trade } from '@uniswap/v3-sdk'
import { CurrentConfig } from '../config'
import {
  ERC20_ABI,
  MAX_FEE_PER_GAS,
  MAX_PRIORITY_FEE_PER_GAS,
  V3_SWAP_ROUTER_ADDRESS,
  WETH_ABI,
  WETH_CONTRACT_ADDRESS,
} from './constants'
import { BigNumber, ethers } from 'ethers'
import { getProvider, TransactionState } from './providers'
import { CurrencyAmount, Percent, Token, TradeType } from '@uniswap/sdk-core'
import { fromReadableAmount } from './conversion'
import { getCurrencyBalance } from './balance'

// MMM buys WETH on the observed Pool every time this function is called. For use on local chain only.
export async function buyWETH() {
  try {
    const ethAmount = CurrencyAmount.fromRawAmount(
      CurrentConfig.mockMarketMakerPool.token0,
      fromReadableAmount(
        CurrentConfig.mockMarketMakerPool.buyAmount,
        CurrentConfig.mockMarketMakerPool.token0.decimals
      )
    )
    const pool = await Pool.initFromChain(
      getProvider(),
      CurrentConfig.tokens.token0,
      CurrentConfig.tokens.token1,
      CurrentConfig.tokens.poolFee
    )

    const options: SwapOptions = {
      slippageTolerance: new Percent(50, 10_000), // 50 bips, or 0.50%
      deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from the current Unix time
      recipient: CurrentConfig.mockMarketMakerWallet.address,
    }
    console.log('Constructed Pool')

    await SwapRouter.executeQuotedSwapOnPool(
      pool,
      ethAmount,
      TradeType.EXACT_OUTPUT,
      options,
      getMMMWallet()
    )
    return TransactionState.Sent
  } catch (err) {
    console.log(err)
    return TransactionState.Rejected
  }
}

// MMM sells WETH on the observed Pool every time this function is called. For use on local chain only.
export async function sellWETH() {
  try {
    const ethAmount = CurrentConfig.mockMarketMakerPool.sellAmount

    const pool = await Pool.initFromChain(
      getProvider(),
      CurrentConfig.tokens.token0,
      CurrentConfig.tokens.token1,
      CurrentConfig.tokens.poolFee
    )

    const swapRoute = new Route(
      [pool],
      CurrentConfig.tokens.token0,
      CurrentConfig.tokens.token1
    )

    const _weth = await wrapETHMMM(ethAmount)

    // We swap locally, so we do not care about the output - never use outputAmount 0 in production
    const uncheckedTrade = Trade.createUncheckedTrade({
      route: swapRoute,
      inputAmount: CurrencyAmount.fromRawAmount(
        CurrentConfig.mockMarketMakerPool.token0,
        fromReadableAmount(
          ethAmount,
          CurrentConfig.mockMarketMakerPool.token0.decimals
        )
      ),
      outputAmount: CurrencyAmount.fromRawAmount(
        CurrentConfig.mockMarketMakerPool.token1,
        0
      ),
      tradeType: TradeType.EXACT_INPUT,
    })
    const _approval = await getTokenTransferApproval(
      V3_SWAP_ROUTER_ADDRESS,
      CurrentConfig.tokens.token0,
      CurrentConfig.mockMarketMakerWallet.address,
      fromReadableAmount(
        ethAmount,
        CurrentConfig.mockMarketMakerPool.token0.decimals
      )
    )

    const options: SwapOptions = {
      slippageTolerance: new Percent(50, 10_000), // 50 bips, or 0.50%
      deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from the current Unix time
      recipient: CurrentConfig.mockMarketMakerWallet.address,
    }

    const methodParameters = SwapRouter.swapCallParameters(
      [uncheckedTrade],
      options
    )

    const tx = {
      data: methodParameters.calldata,
      to: V3_SWAP_ROUTER_ADDRESS,
      value: methodParameters.value,
      from: CurrentConfig.mockMarketMakerWallet.address,
      maxFeePerGas: MAX_FEE_PER_GAS,
      maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
    }

    return sendTransactionViaMockWallet(tx)
  } catch (err) {
    console.log(err)
    return TransactionState.Rejected
  }
}

// Called on startup on local chain. Sells half the ETH on the MMM for Token1
export async function getToken1FromMockPool(sellETHAmount: number) {
  await setMMMBalanceLocal()

  const balance0 = await getCurrencyBalance(
    getProvider(),
    CurrentConfig.mockMarketMakerWallet.address,
    CurrentConfig.mockMarketMakerPool.token0
  )
  console.log('Balance 0: ' + balance0)
  if (Number(balance0) < sellETHAmount) {
    await wrapETHMMM(sellETHAmount)
  }

  const pool = await Pool.initFromChain(
    getProvider(),
    CurrentConfig.mockMarketMakerPool.token0,
    CurrentConfig.mockMarketMakerPool.token1,
    CurrentConfig.mockMarketMakerPool.poolFee
  )

  const currencyAmount = CurrencyAmount.fromRawAmount(
    CurrentConfig.mockMarketMakerPool.token0,
    fromReadableAmount(
      sellETHAmount,
      CurrentConfig.mockMarketMakerPool.token0.decimals
    )
  )

  await SwapRouter.executeQuotedSwapOnPool(
    pool,
    currencyAmount,
    TradeType.EXACT_INPUT,
    undefined,
    getMMMWallet()
  )
}

function getMMMWallet(): ethers.Wallet {
  const provider = getProvider()
  const mockWallet = new ethers.Wallet(
    CurrentConfig.mockMarketMakerWallet.privateKey,
    provider
  )
  return mockWallet
}

async function sendTransactionViaMockWallet(
  transaction: ethers.providers.TransactionRequest
): Promise<TransactionState> {
  const wallet = getMMMWallet()

  if (transaction.value) {
    transaction.value = BigNumber.from(transaction.value)
  }
  const txRes = await wallet.sendTransaction(transaction)

  let receipt = null
  const provider = getProvider()
  if (!provider) {
    return TransactionState.Failed
  }

  while (receipt === null) {
    try {
      receipt = await provider.getTransactionReceipt(txRes.hash)

      if (receipt === null) {
        continue
      }
    } catch (e) {
      console.log(`Receipt error:`, e)
      break
    }
  }

  // Transaction was successful if status === 1
  if (receipt) {
    return TransactionState.Sent
  } else {
    return TransactionState.Failed
  }
}

// wraps ETH (rounding up to the nearest ETH for decimal places)
async function wrapETHMMM(eth: number) {
  const provider = getProvider()
  const address = CurrentConfig.mockMarketMakerWallet.address
  if (!provider || !address) {
    throw new Error('Cannot wrap ETH without a provider and wallet address')
  }

  const wallet = getMMMWallet()

  const wethContract = new ethers.Contract(
    WETH_CONTRACT_ADDRESS,
    WETH_ABI,
    wallet
  )

  const transaction = {
    data: wethContract.interface.encodeFunctionData('deposit'),
    value: (BigInt(eth) * 10n ** 18n).toString(10),
    from: address,
    to: WETH_CONTRACT_ADDRESS,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
    gasLimit: '1000000',
  }

  await sendTransactionViaMockWallet(transaction)
}

async function setMMMBalanceLocal() {
  const amountHex = ethers.utils.parseEther('10000').toHexString()
  const provider = new ethers.providers.JsonRpcProvider(CurrentConfig.rpc.local)
  const result = provider.send('anvil_setBalance', [
    CurrentConfig.mockMarketMakerWallet.address,
    amountHex,
  ])
  return result
}

async function getTokenTransferApproval(
  contractAddress: string,
  token: Token,
  address: string,
  amount: bigint
): Promise<TransactionState> {
  const provider = getProvider()
  if (!provider || !address) {
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

    return sendTransactionViaMockWallet({
      ...transaction,
      from: address,
    })
  } catch (e) {
    console.error(e)
    return TransactionState.Failed
  }
}
