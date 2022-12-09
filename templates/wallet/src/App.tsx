import React, { useEffect, useState } from 'react'
import './App.css'
import { ethers } from 'ethers'
import { AlphaRouter, ChainId, SwapType } from '@uniswap/smart-order-router'
import { Currency, TradeType, Percent, CurrencyAmount } from '@uniswap/sdk-core'
import { Web3Provider } from '@ethersproject/providers'
import { CurrentEnvironment } from './env'

// Constants
const erc20Abi = [
  // Read-Only Functions
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',

  // Authenticated Functions
  'function transfer(address to, uint amount) returns (bool)',

  // Events
  'event Transfer(address indexed from, address indexed to, uint amount)',
]
const V3_SWAP_ROUTER_ADDRESS = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'

export enum TxState {
  Failed = 'Failed',
  New = 'New',
  Sending = 'Sending',
  Sent = 'Success',
}

const rpcProvider = new ethers.providers.JsonRpcProvider(CurrentEnvironment.mainnetRpcUrl)

const useProvider = () => {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider>()

  useEffect(() => {
    const getProvider = async () => {
      const provider = new ethers.providers.Web3Provider(window?.ethereum, 'any')
      setProvider(provider)
    }
    getProvider()
  }, [])

  return provider
}

const useAccounts = (provider: Web3Provider | undefined) => {
  const [accounts, setAccounts] = useState<string[]>()

  useEffect(() => {
    if (!provider) {
      return
    }
    const getAccounts = async () => {
      const accounts = await provider.send('eth_requestAccounts', [])
      setAccounts(accounts)
    }

    getAccounts()
    const subscription = provider.on('accountsChanged', () => {
      getAccounts()
    })
    return () => {
      subscription.removeAllListeners()
    }
  }, [provider])

  return accounts
}

const connectWallet = async () => {
  if (!window.ethereum) {
    return
  }

  const { ethereum } = window

  const provider = new ethers.providers.Web3Provider(ethereum)
  const accounts = await provider.send('eth_requestAccounts', [])
  return accounts
}

const useUpdateOnBlock = (provider: Web3Provider | undefined, callback: (blockNumber: number) => void) => {
  useEffect(() => {
    if (!provider) {
      return
    }
    const subscription = provider.on('block', (blockNumber: number) => {
      callback(blockNumber)
    })
    return () => {
      subscription.removeAllListeners()
    }
  }, [callback, provider])
}

const getCurrencyBalance = async (currency: Currency, provider: Web3Provider | undefined, address: string) => {
  if (!provider) {
    return
  }

  if (currency.isNative) {
    return ethers.utils.formatEther(await provider.getBalance(address))
  }

  const usdc = new ethers.Contract(currency.address, erc20Abi, provider)
  const balance = await usdc.balanceOf(address)
  return balance
}

const route = async (
  setTxState: (txState: TxState) => void,
  accounts: string[] | undefined,
  provider: Web3Provider | undefined
) => {
  if (!accounts || accounts?.length < 1 || !provider) {
    return
  }

  const router = new AlphaRouter({ chainId: ChainId.MAINNET, provider: rpcProvider })
  const recipient = accounts[0]

  if (!recipient) {
    setTxState(TxState.Failed)
    return
  }

  setTxState(TxState.Sending)
  const route = await router.route(
    CurrencyAmount.fromRawAmount(CurrentEnvironment.currencyIn, CurrentEnvironment.currencyInAmount),
    CurrentEnvironment.currencyOut,
    TradeType.EXACT_INPUT,
    {
      recipient,
      slippageTolerance: new Percent(5, 100),
      deadline: Math.floor(Date.now() / 1000 + 1800),
      type: SwapType.SWAP_ROUTER_02,
    }
  )

  const tx = {
    data: route?.methodParameters?.calldata,
    to: V3_SWAP_ROUTER_ADDRESS,
    value: route?.methodParameters?.value,
    from: recipient,
  }

  try {
    const receipt = await provider?.send('eth_sendTransaction', [tx])
    if (receipt) {
      setTxState(TxState.Sent)
    }
  } catch (e) {
    setTxState(TxState.Failed)
  }
}

function App() {
  const [txState, setTxState] = useState<TxState>(TxState.New)
  const [tokenInBalance, setTokenInBalance] = useState<string>()
  const [tokenOutBalance, setTokenOutBalance] = useState<string>()
  const [blockNumber, setBlockNumber] = useState<number>(0)
  const provider = useProvider()
  const accounts = useAccounts(provider)

  useUpdateOnBlock(provider, async (blockNumber: number) => {
    if (!accounts || accounts?.length < 1) {
      return
    }
    const userAddress = accounts[0]
    const currentTokenInBalance = await getCurrencyBalance(CurrentEnvironment.currencyIn, provider, userAddress)
    setTokenInBalance(currentTokenInBalance)
    const currentTokenOutBalance = await getCurrencyBalance(CurrentEnvironment.currencyOut, provider, userAddress)
    setTokenOutBalance(currentTokenOutBalance)
    setBlockNumber(blockNumber)
  })

  return (
    <div className="App">
      <header className="App-header">
        {!provider && <h3>Please install a Wallet!</h3>}
        {provider && !accounts && <button onClick={() => connectWallet()}>Connect Wallet</button>}
        {provider && accounts && (
          <>
            <h3>{`Connected: ${accounts}`}</h3>
            <h3>{`Building Block number: ${blockNumber + 1}`}</h3>
            <h3>{`TxState: ${txState}`}</h3>
            <h3>{`Token in balance: ${tokenInBalance}`}</h3>
            <h3>{`Token out balance: ${tokenOutBalance}`}</h3>
            <button onClick={() => route(setTxState, accounts, provider)} disabled={txState === TxState.Sending}>
              <p>Trade</p>
            </button>
          </>
        )}
      </header>
    </div>
  )
}

export default App
