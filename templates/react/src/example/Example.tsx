import React, { useCallback, useEffect, useState } from 'react'
import './Example.css'
import { ethers } from 'ethers'
import { AlphaRouter, ChainId, SwapType } from '@uniswap/smart-order-router'
import { TradeType, CurrencyAmount, Percent } from '@uniswap/sdk-core'
import { Environment, CurrentConfig } from '../config'
import { getCurrencyBalance } from '../libs/wallet'
import {
  connectBrowserExtensionWallet,
  getMainnetProvider,
  getProvider,
  getWalletAddress,
  sendTransaction,
  TransactionState,
} from '../libs/providers'
import {
  V3_SWAP_ROUTER_ADDRESS,
  MAX_FEE_PER_GAS,
  MAX_PRIORITY_FEE_PER_GAS,
} from '../libs/constants'

async function route(): Promise<TransactionState> {
  const router = new AlphaRouter({
    chainId: ChainId.MAINNET,
    provider: getMainnetProvider(),
  })
  const address = getWalletAddress()

  if (!address) {
    return TransactionState.Failed
  }

  const route = await router.route(
    CurrencyAmount.fromRawAmount(
      CurrentConfig.currencies.in,
      ethers.utils
        .parseEther(CurrentConfig.currencies.amountIn.toString())
        .toString()
    ),
    CurrentConfig.currencies.out,
    TradeType.EXACT_INPUT,
    {
      recipient: CurrentConfig.wallet.address,
      slippageTolerance: new Percent(5, 100),
      deadline: Math.floor(Date.now() / 1000 + 1800),
      type: SwapType.SWAP_ROUTER_02,
    }
  )

  const res = await sendTransaction({
    data: route?.methodParameters?.calldata,
    to: V3_SWAP_ROUTER_ADDRESS,
    value: route?.methodParameters?.value,
    from: address,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
  })

  return res
}

const useOnBlockUpdated = (callback: (blockNumber: number) => void) => {
  useEffect(() => {
    const subscription = getProvider()?.on('block', callback)
    return () => {
      subscription?.removeAllListeners()
    }
  })
}

const Example = () => {
  const [tokenInBalance, setTokenInBalance] = useState<string>()
  const [tokenOutBalance, setTokenOutBalance] = useState<string>()
  const [txState, setTxState] = useState<TransactionState>(TransactionState.New)
  const [blockNumber, setBlockNumber] = useState<number>(0)

  // Listen for new blocks and update the wallet
  useOnBlockUpdated(async (blockNumber: number) => {
    refreshBalances()
    setBlockNumber(blockNumber)
  })

  // Update wallet state given a block number
  const refreshBalances = useCallback(async () => {
    const provider = getProvider()
    const address = getWalletAddress()
    if (address && provider) {
      setTokenInBalance(
        await getCurrencyBalance(provider, address, CurrentConfig.currencies.in)
      )
      setTokenOutBalance(
        await getCurrencyBalance(
          provider,
          address,
          CurrentConfig.currencies.out
        )
      )
    }
  }, [])

  // Event Handlers

  const onConnectWallet = useCallback(async () => {
    if (await connectBrowserExtensionWallet()) {
      refreshBalances()
    }
  }, [refreshBalances])

  const onTrade = useCallback(async () => {
    setTxState(TransactionState.Sending)
    setTxState(await route())
  }, [])

  return (
    <div className="App">
      {CurrentConfig.rpc.mainnet === '' && (
        <h2 className="error">Please set your mainnet RPC URL in config.ts</h2>
      )}
      {CurrentConfig.env === Environment.WALLET_EXTENSION &&
        getProvider() === null && (
          <h2 className="error">
            Please install a wallet to use this example configuration
          </h2>
        )}
      <h3>{`Wallet Address: ${getWalletAddress()}`}</h3>
      {CurrentConfig.env === Environment.WALLET_EXTENSION &&
        !getWalletAddress() && (
          <button onClick={onConnectWallet}>Connect Wallet</button>
        )}
      <h3>{`Block Number: ${blockNumber + 1}`}</h3>
      <h3>{`Transaction State: ${txState}`}</h3>
      <h3>{`Token In (ETH) Balance: ${tokenInBalance}`}</h3>
      <h3>{`Token Out (USDC) Balance: ${tokenOutBalance}`}</h3>
      <button
        onClick={onTrade}
        disabled={
          txState === TransactionState.Sending ||
          getProvider() === null ||
          CurrentConfig.rpc.mainnet === ''
        }>
        <p>Trade</p>
      </button>
    </div>
  )
}

export default Example
