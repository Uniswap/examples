import React, { useEffect, useState } from 'react'
import './Example.css'
import { ethers, BigNumber } from 'ethers'
import { AlphaRouter, ChainId, SwapType } from '@uniswap/smart-order-router'
import { TradeType, CurrencyAmount, Percent } from '@uniswap/sdk-core'
import { ChainEnvironment, CurrentConfig } from '../config'
import { getCurrencyBalance } from '../libs/wallet'
import { V3_SWAP_ROUTER_ADDRESS } from '../libs/addresses'
import { connectWallet, rpcProvider, sendTransaction, TransactionState, wallet, windowProvider } from '../libs/provider'
import { Web3Provider } from '@ethersproject/providers'
import { providers } from 'ethers'

const route = async (account: string, setTxState: (txState: TransactionState) => void) => {
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

  const res = await sendTransaction({
    data: route?.methodParameters?.calldata,
    to: V3_SWAP_ROUTER_ADDRESS,
    value:
      CurrentConfig.env !== ChainEnvironment.WALLET_EXTENSION
        ? route?.methodParameters?.value
        : BigNumber.from(route?.methodParameters?.value),
    from: account,
    gasLimit: 300000,
  })

  setTxState(res)
}

function Example() {
  const [tokenInBalance, setTokenInBalance] = useState<string>()
  const [tokenOutBalance, setTokenOutBalance] = useState<string>()
  const [txState, setTxState] = useState<TransactionState>(TransactionState.New)
  const [blockNumber, setBlockNumber] = useState<number>(0)

  const [account, setAccount] = useState<string>()

  const onConnectWallet = async () => {
    const account = await connectWallet()
    setAccount(account[0])
    refreshBalances(windowProvider, account[0])
  }

  // Update wallet state given a block number
  const refreshBalances = async (provider: Web3Provider | providers.Provider, address: string) => {
    setTokenInBalance(await getCurrencyBalance(provider, address, CurrentConfig.currencies.tokenIn))
    setTokenOutBalance(await getCurrencyBalance(provider, address, CurrentConfig.currencies.tokenOut))
  }

  // Listen for new blocks and update the wallet
  useEffect(() => {
    const blockProvider = CurrentConfig.env !== ChainEnvironment.WALLET_EXTENSION ? wallet.provider : windowProvider
    const subscription = blockProvider.on('block', async (blockNumber: number) => {
      if (CurrentConfig.env !== ChainEnvironment.WALLET_EXTENSION) {
        refreshBalances(wallet.provider, wallet.address)
      } else {
        if (account) {
          refreshBalances(windowProvider, account)
        }
      }
      setBlockNumber(blockNumber)
    })
    return () => {
      subscription.removeAllListeners()
    }
  }, [account])

  return (
    <div className="App">
      <header className="App-header">
        {account}
        <button onClick={onConnectWallet}>Connect Wallet</button>
        <h3>{`Block Number: ${blockNumber + 1}`}</h3>
        <h3>{`Transaction State: ${txState}`}</h3>
        <h3>{`Token In (ETH) Balance: ♦${tokenInBalance}`}</h3>
        <h3>{`Token Out (USDC) Balance: $${tokenOutBalance}`}</h3>
        <button
          onClick={() => route(account ?? wallet.address, setTxState)}
          disabled={txState === TransactionState.Sending}>
          <p>Trade</p>
        </button>
      </header>
    </div>
  )
}

export default Example
