import React, { useEffect, useState } from 'react'
import './App.css'
import { ethers, BigNumber } from 'ethers'
import { AlphaRouter, ChainId, SwapType } from '@uniswap/smart-order-router'
import { TradeType, CurrencyAmount, Percent, Currency } from '@uniswap/sdk-core'
import { CurrentEnvironment } from './env'
import { abi as QuoterABI } from '@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json'

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
const localRpcProvider = new ethers.providers.JsonRpcProvider(CurrentEnvironment.localRpcUrl)
const wallet = new ethers.Wallet(
  CurrentEnvironment.privateKey,
  CurrentEnvironment.isLocal ? localRpcProvider : rpcProvider
)

const getCurrencyBalance = async (currency: Currency) => {
  if (currency.isNative) {
    return ethers.utils.formatEther(await wallet.provider.getBalance(wallet.address))
  }

  const usdc = new ethers.Contract(currency.address, erc20Abi, wallet.provider)
  const balance = await usdc.balanceOf(wallet.address)
  return balance
}

const useUpdateOnBlock = (callback: (blockNumber: number) => void) => {
  useEffect(() => {
    const subscription = wallet.provider.on('block', (blockNumber: number) => {
      callback(blockNumber)
    })
    return () => {
      subscription.removeAllListeners()
    }
  }, [callback])
}

const route = async (setTxState: (txState: TxState) => void) => {
  const router = new AlphaRouter({ chainId: ChainId.MAINNET, provider: rpcProvider })

  setTxState(TxState.Sending)
  const route = await router.route(
    CurrencyAmount.fromRawAmount(CurrentEnvironment.currencyIn, CurrentEnvironment.currencyInAmount),
    CurrentEnvironment.currencyOut,
    TradeType.EXACT_INPUT,
    {
      recipient: CurrentEnvironment.address,
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
    setTxState(TxState.Sent)
  } else {
    setTxState(TxState.Failed)
  }
}

function App() {
  const [tokenInBalance, setTokenInBalance] = useState<string>()
  const [tokenOutBalance, setTokenOutBalance] = useState<string>()
  const [txState, setTxState] = useState<TxState>(TxState.New)
  const [blockNumber, setBlockNumber] = useState<number>(0)

  useUpdateOnBlock(async (blockNumber: number) => {
    const currentTokenInBalance = await getCurrencyBalance(CurrentEnvironment.currencyIn)
    setTokenInBalance(currentTokenInBalance)
    const currentTokenOutBalance = await getCurrencyBalance(CurrentEnvironment.currencyOut)
    setTokenOutBalance(currentTokenOutBalance)
    setBlockNumber(blockNumber)
  })

  return (
    <div className="App">
      <header className="App-header">
        <h3>{`Building Block number: ${blockNumber + 1}`}</h3>
        <h3>{`Token in Balance: ${tokenInBalance}`}</h3>
        <h3>{`Token out Balance: ${tokenOutBalance}`}</h3>
        <button onClick={() => route(setTxState)} disabled={txState === TxState.Sending}>
          <p>Quote</p>
        </button>
      </header>
    </div>
  )
}

export default App
