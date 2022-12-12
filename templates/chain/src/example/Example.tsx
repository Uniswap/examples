import React, { useEffect, useState } from 'react'
import './Example.css'
import { ethers, BigNumber } from 'ethers'
import { AlphaRouter, ChainId, SwapType } from '@uniswap/smart-order-router'
import { TradeType, CurrencyAmount, Percent } from '@uniswap/sdk-core'
import { ChainEnvironment, CurrentConfig } from '../config'
import { getCurrencyBalance } from '../libs/wallet'
import { V3_SWAP_ROUTER_ADDRESS } from '../libs/addresses'

export enum TransactionState {
  Failed = 'Failed',
  New = 'New',
  Sending = 'Sending',
  Success = 'Success',
}

// Set up providers and wallet
const rpcProvider = new ethers.providers.JsonRpcProvider(CurrentConfig.rpc.mainnet)
const localRpcProvider = new ethers.providers.JsonRpcProvider(CurrentConfig.rpc.local)
const wallet = new ethers.Wallet(
  CurrentConfig.wallet.privateKey,
  CurrentConfig.env == ChainEnvironment.LOCAL ? localRpcProvider : rpcProvider
)

const route = async (setTxState: (txState: TransactionState) => void) => {
  const router = new AlphaRouter({ chainId: ChainId.MAINNET, provider: rpcProvider })

  setTxState(TransactionState.Sending)
  const route = await router.route(
    CurrencyAmount.fromRawAmount(
      CurrentConfig.currencies.tokenIn,
      ethers.utils.parseEther(CurrentConfig.currencies.amountIn.toString()).toString()
    ),
    CurrentConfig.currencies.tokenOut,
    TradeType.EXACT_INPUT,
    {
      recipient: CurrentConfig.wallet.address,
      slippageTolerance: new Percent(5, 100),
      deadline: Math.floor(Date.now() / 1000 + 1800),
      type: SwapType.SWAP_ROUTER_02,
    }
  )

  const transaction = {
    data: route?.methodParameters?.calldata,
    to: V3_SWAP_ROUTER_ADDRESS,
    value: BigNumber.from(route?.methodParameters?.value),
  }

  const res = await wallet.sendTransaction(transaction)
  const txReceipt = await res.wait()

  // Transaction was successful if status === 1
  if (txReceipt.status === 1) {
    setTxState(TransactionState.Success)
  } else {
    setTxState(TransactionState.Failed)
  }
}

function Example() {
  const [tokenInBalance, setTokenInBalance] = useState<string>()
  const [tokenOutBalance, setTokenOutBalance] = useState<string>()
  const [txState, setTxState] = useState<TransactionState>(TransactionState.New)
  const [blockNumber, setBlockNumber] = useState<number>(0)

  const updateWalletState = async (blockNumber: number) => {
    setTokenInBalance(await getCurrencyBalance(wallet, CurrentConfig.currencies.tokenIn))
    setTokenOutBalance(await getCurrencyBalance(wallet, CurrentConfig.currencies.tokenOut))
    setBlockNumber(blockNumber)
  }

  useEffect(() => {
    const subscription = wallet.provider.on('block', updateWalletState)
    return () => {
      subscription.removeAllListeners()
    }
  })

  return (
    <div className="App">
      <header className="App-header">
        <h3>{`Building Block number: ${blockNumber + 1}`}</h3>
        <h3>{`Token in Balance: ${tokenInBalance}`}</h3>
        <h3>{`Token out Balance: ${tokenOutBalance}`}</h3>
        <button onClick={() => route(setTxState)} disabled={txState === TransactionState.Sending}>
          <p>Trade</p>
        </button>
      </header>
    </div>
  )
}

export default Example
