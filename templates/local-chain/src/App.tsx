import React, { useEffect, useState } from 'react'
import './App.css'
import { ethers, BigNumber } from 'ethers'
import { AlphaRouter, ChainId, SwapType } from '@uniswap/smart-order-router'
import { Token, TradeType, CurrencyAmount, Percent, Ether } from '@uniswap/sdk-core'

// Inputs
const TOKEN_IN = Ether.onChain(ChainId.MAINNET)
const TOKEN_IN_AMOUNT = 1000000000000000000
const TOKEN_OUT = new Token(ChainId.MAINNET, '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 6, 'USDC', 'USD//C')

// Variables
const MY_ADDRESS = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'
const MY_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

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

const web3Provider = new ethers.providers.JsonRpcProvider(
  'https://mainnet.infura.io/v3/0ac57a06f2994538829c14745750d721'
)
const localChainWeb3Provider = new ethers.providers.JsonRpcProvider('http://localhost:8545')
const wallet = new ethers.Wallet(MY_PRIVATE_KEY, localChainWeb3Provider)

const getEthBalance = async () => {
  const balance = await localChainWeb3Provider.getBalance(wallet.address)
  return ethers.utils.formatEther(balance)
}

const getTokenBalance = async (token: Token) => {
  const usdc = new ethers.Contract(token.address, erc20Abi, web3Provider)
  const balance = await usdc.balanceOf(wallet.address)
  return balance
}

const useUpdateOnBlock = (callback: () => void) => {
  useEffect(() => {
    const subscription = web3Provider.on('block', () => {
      callback()
    })
    return () => {
      subscription.removeAllListeners()
    }
  }, [callback])
}

function App() {
  const [tokenInBalance, setTokenInBalance] = useState('')
  const [tokenOutBalance, setTokenOutBalance] = useState('')
  const [txStatus, setTxStatus] = useState<TxState>(TxState.New)

  useUpdateOnBlock(async () => {
    const currentTokenInBalance = await getEthBalance()
    setTokenInBalance(currentTokenInBalance)
    const currentTokenOutBalance = await getTokenBalance(TOKEN_OUT)
    setTokenOutBalance(currentTokenOutBalance)
  })

  const route = async () => {
    const router = new AlphaRouter({ chainId: ChainId.MAINNET, provider: web3Provider })

    setTxStatus(TxState.Sending)
    const route = await router.route(
      CurrencyAmount.fromRawAmount(TOKEN_IN, TOKEN_IN_AMOUNT),
      TOKEN_OUT,
      TradeType.EXACT_INPUT,
      {
        recipient: MY_ADDRESS,
        slippageTolerance: new Percent(5, 100),
        deadline: Math.floor(Date.now() / 1000 + 1800),
        type: SwapType.SWAP_ROUTER_02,
      }
    )

    const tx = {
      data: route?.methodParameters?.calldata,
      to: V3_SWAP_ROUTER_ADDRESS,
      value: BigNumber.from(route?.methodParameters?.value),
    }

    const res = await wallet.sendTransaction(tx)

    const txReceipt = await res.wait()

    //tx was mined successfully == 1
    if (txReceipt.status === 1) {
      setTxStatus(TxState.Sent)
    } else {
      setTxStatus(TxState.Failed)
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <h3>{`Token in Balance: ${tokenInBalance}`}</h3>
        <h3>{`Token out Balance: ${tokenOutBalance}`}</h3>
        <button onClick={() => route()} disabled={txStatus === TxState.Sending}>
          <p>Trade</p>
        </button>
      </header>
    </div>
  )
}

export default App
