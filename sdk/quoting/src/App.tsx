import React, { useState } from 'react'
import './App.css'
import { ethers } from 'ethers'
import { CurrentEnvironment } from './env'
import Quoter from '@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json'
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import { FeeAmount, computePoolAddress } from '@uniswap/v3-sdk'

export enum TxState {
  Failed = 'Failed',
  New = 'New',
  Sending = 'Sending',
  Sent = 'Success',
}

const rpcProvider = new ethers.providers.JsonRpcProvider(CurrentEnvironment.mainnetRpcUrl)
const localRpcProvider = new ethers.providers.JsonRpcProvider(CurrentEnvironment.localRpcUrl)

const quoterAddress = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6'
const quoterContract = new ethers.Contract(
  quoterAddress,
  Quoter.abi,
  CurrentEnvironment.isLocal ? localRpcProvider : rpcProvider
)

const POOL_FACTORY_ADDRESS = '0x1F98431c8aD98523631AE4a59f267346ea31F984'
const poolAddress = computePoolAddress({
  factoryAddress: POOL_FACTORY_ADDRESS,
  tokenA: CurrentEnvironment.tokenIn,
  tokenB: CurrentEnvironment.tokenOut,
  fee: FeeAmount.MEDIUM,
})

const poolContract = new ethers.Contract(
  poolAddress,
  IUniswapV3PoolABI.abi,
  CurrentEnvironment.isLocal ? localRpcProvider : rpcProvider
)

const getPoolConstants = async () => {
  const [token0, token1, fee] = await Promise.all([poolContract.token0(), poolContract.token1(), poolContract.fee()])

  return {
    token0,
    token1,
    fee,
  }
}

const quote = async (setTxState: (txState: TxState) => void, setOutputAmount: (outputAmount: string) => void) => {
  const poolConstants = await getPoolConstants()

  const quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(
    poolConstants.token0,
    poolConstants.token1,
    poolConstants.fee,
    CurrentEnvironment.tokenInAmount,
    0
  )

  setOutputAmount((quotedAmountOut / Math.pow(10, CurrentEnvironment.tokenOut.decimals)).toString())
  setTxState(TxState.Sending)
}

function App() {
  const [txState, setTxState] = useState<TxState>(TxState.New)
  const [outputAmount, setOutputAmount] = useState<string>()

  return (
    <div className="App">
      <header className="App-header">
        <h3>{`Quote input amount: ${
          CurrentEnvironment.tokenInAmount / Math.pow(10, CurrentEnvironment.tokenIn.decimals)
        } ${CurrentEnvironment.tokenIn.symbol}`}</h3>
        <h3>{`Quote output amount: ${outputAmount} ${CurrentEnvironment.tokenOut.symbol}`}</h3>
        <button onClick={() => quote(setTxState, setOutputAmount)} disabled={txState === TxState.Sending}>
          <p>Trade</p>
        </button>
      </header>
    </div>
  )
}

export default App
