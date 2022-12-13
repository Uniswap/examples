import React, { useState } from 'react'
import './App.css'
import { ethers } from 'ethers'
import { CurrentEnvironment } from './env'
import Quoter from '@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json'
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import { FeeAmount, computePoolAddress } from '@uniswap/v3-sdk'

const rpcProvider = new ethers.providers.JsonRpcProvider(CurrentEnvironment.mainnetRpcUrl)
const localRpcProvider = new ethers.providers.JsonRpcProvider(CurrentEnvironment.localRpcUrl)
const POOL_FACTORY_CONTRACT_ADDRESS = '0x1F98431c8aD98523631AE4a59f267346ea31F984'
const QUOTER_CONTRACT_ADDRESS = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6'

const getPoolConstants = async () => {
  const currentPoolAddress = computePoolAddress({
    factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
    tokenA: CurrentEnvironment.tokenIn,
    tokenB: CurrentEnvironment.tokenOut,
    fee: FeeAmount.MEDIUM,
  })

  const poolContract = new ethers.Contract(
    currentPoolAddress,
    IUniswapV3PoolABI.abi,
    CurrentEnvironment.isLocal ? localRpcProvider : rpcProvider
  )

  const [token0, token1, fee] = await Promise.all([poolContract.token0(), poolContract.token1(), poolContract.fee()])

  return {
    token0,
    token1,
    fee,
  }
}

const quote = async (setOutputAmount: (outputAmount: number) => void) => {
  const quoterContract = new ethers.Contract(
    QUOTER_CONTRACT_ADDRESS,
    Quoter.abi,
    CurrentEnvironment.isLocal ? localRpcProvider : rpcProvider
  )
  const poolConstants = await getPoolConstants()

  const quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(
    poolConstants.token0,
    poolConstants.token1,
    poolConstants.fee,
    CurrentEnvironment.tokenInAmount * Math.pow(10, CurrentEnvironment.tokenIn.decimals),
    0
  )

  setOutputAmount(quotedAmountOut / Math.pow(10, CurrentEnvironment.tokenOut.decimals))
}

function App() {
  const [outputAmount, setOutputAmount] = useState<number>()

  return (
    <div className="App">
      <header className="App-header">
        <h3>{`Quote input amount: ${CurrentEnvironment.tokenInAmount} ${CurrentEnvironment.tokenIn.symbol}`}</h3>
        <h3>{`Quote output amount: ${outputAmount} ${CurrentEnvironment.tokenOut.symbol}`}</h3>
        <button onClick={() => quote(setOutputAmount)}>
          <p>Trade</p>
        </button>
      </header>
    </div>
  )
}

export default App
