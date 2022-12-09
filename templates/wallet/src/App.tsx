import React, { useEffect, useState } from 'react'
import './App.css'
import { ethers } from 'ethers'
import { AlphaRouter, ChainId, SwapType } from '@uniswap/smart-order-router'
import { Token, TradeType, CurrencyAmount, Percent, Ether } from '@uniswap/sdk-core'
import { Web3Provider } from '@ethersproject/providers'

// Inputs
const TOKEN_IN = Ether.onChain(ChainId.MAINNET)
const TOKEN_IN_AMOUNT = 1000000000000000000
const TOKEN_OUT = new Token(ChainId.MAINNET, '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 6, 'USDC', 'USD//C')

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
  Sending = 'Signing',
  Sent = 'Success',
}

const rpcProvider = new ethers.providers.JsonRpcProvider(
  'https://mainnet.infura.io/v3/0ac57a06f2994538829c14745750d721'
)

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

const useUpdateOnBlock = (provider: Web3Provider | undefined, callback: () => void) => {
  useEffect(() => {
    if (!provider) {
      return
    }
    const subscription = provider.on('block', () => {
      callback()
    })
    return () => {
      subscription.removeAllListeners()
    }
  }, [callback, provider])
}

const getEthBalance = async (provider: Web3Provider | undefined, address: string) => {
  if (!provider) {
    return
  }
  const balance = await provider.getBalance(address)
  return ethers.utils.formatEther(balance)
}

const getTokenBalance = async (token: Token, provider: Web3Provider | undefined, address: string) => {
  if (!provider) {
    return
  }
  const usdc = new ethers.Contract(token.address, erc20Abi, provider)
  const balance = await usdc.balanceOf(address)
  return balance
}

const route = async (
  callback: (txStatus: TxState) => void,
  accounts: string[] | undefined,
  provider: Web3Provider | undefined
) => {
  if (!accounts || accounts?.length < 1 || !provider) {
    return
  }

  const router = new AlphaRouter({ chainId: ChainId.MAINNET, provider: rpcProvider })
  const recipient = accounts[0]

  if (!recipient) {
    callback(TxState.Failed)
    return
  }

  callback(TxState.Sending)
  const route = await router.route(
    CurrencyAmount.fromRawAmount(TOKEN_IN, TOKEN_IN_AMOUNT),
    TOKEN_OUT,
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

  const receipt = await provider?.send('eth_sendTransaction', [tx])

  if (receipt) {
    callback(TxState.Sent)
  } else {
    callback(TxState.Failed)
  }
}

function App() {
  const [txStatus, setTxStatus] = useState<TxState>(TxState.New)
  const [tokenInBalance, setTokenInBalance] = useState<string>()
  const [tokenOutBalance, setTokenOutBalance] = useState('')
  const provider = useProvider()
  const accounts = useAccounts(provider)

  useUpdateOnBlock(provider, async () => {
    if (!accounts || accounts?.length < 1) {
      return
    }
    const userAddress = accounts[0]
    const currentTokenInBalance = await getEthBalance(provider, userAddress)
    setTokenInBalance(currentTokenInBalance)
    const currentTokenOutBalance = await getTokenBalance(TOKEN_OUT, provider, userAddress)
    setTokenOutBalance(currentTokenOutBalance)
  })

  return (
    <div className="App">
      <header className="App-header">
        {!provider && <h3>Please install a Wallet!</h3>}
        {provider && !accounts && <button onClick={() => connectWallet()}>Connect Wallet</button>}
        {provider && accounts && (
          <>
            <h3>{`Connected: ${accounts}`}</h3>
            <h3>{`TxStatus: ${txStatus}`}</h3>
            <h3>{`Token in balance: ${tokenInBalance}`}</h3>
            <h3>{`Token out balance: ${tokenOutBalance}`}</h3>
            <button onClick={() => route(setTxStatus, accounts, provider)} disabled={txStatus === TxState.Sending}>
              <p>Trade</p>
            </button>
          </>
        )}
      </header>
    </div>
  )
}

export default App
