import React, { useState, useCallback } from 'react'
import './Example.css'
import { ethers } from 'ethers'
import { Token } from '@uniswap/sdk-core'
import { CurrentConfig, Environment } from '../config'
import { FeeAmount, computePoolAddress } from '@uniswap/v3-sdk'
import Quoter from '@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json'
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import { POOL_FACTORY_CONTRACT_ADDRESS, QUOTER_CONTRACT_ADDRESS } from '../libs/constants'
import { getProvider, getWalletAddress, connectBrowserExtensionWallet } from '../libs/providers'
import { toReadableAmount, fromReadableAmount } from '../libs/conversion'

const getPoolConstants = async (): Promise<{ token0: string; token1: string; fee: string }> => {
  const provider = getProvider()
  if (!provider) {
    throw new Error('Provider not found')
  }
  const currentPoolAddress = computePoolAddress({
    factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
    tokenA: CurrentConfig.currencies.in as Token,
    tokenB: CurrentConfig.currencies.out as Token,
    fee: FeeAmount.MEDIUM,
  })

  const poolContract = new ethers.Contract(currentPoolAddress, IUniswapV3PoolABI.abi, provider)
  const [token0, token1, fee] = await Promise.all([poolContract.token0(), poolContract.token1(), poolContract.fee()])

  return {
    token0,
    token1,
    fee,
  }
}

const quote = async (setOutputAmount: (outputAmount: number) => void) => {
  const provider = getProvider()
  if (!provider) {
    throw new Error('Provider not found')
  }
  const quoterContract = new ethers.Contract(QUOTER_CONTRACT_ADDRESS, Quoter.abi, provider)
  const poolConstants = await getPoolConstants()

  const quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(
    poolConstants.token0,
    poolConstants.token1,
    poolConstants.fee,
    fromReadableAmount(CurrentConfig.currencies.amountIn, CurrentConfig.currencies.in.decimals),
    0
  )

  setOutputAmount(toReadableAmount(quotedAmountOut, CurrentConfig.currencies.out.decimals))
}

function App() {
  const [outputAmount, setOutputAmount] = useState<number>()

  const onConnectWallet = useCallback(async () => {
    await connectBrowserExtensionWallet()
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        {CurrentConfig.rpc.mainnet === '' && <h2 className="error">Please set your mainnet RPC URL in config.ts</h2>}
        {CurrentConfig.env === Environment.WALLET_EXTENSION && getProvider() === null && (
          <h2 className="error">Please install a wallet to use this example configuration</h2>
        )}
        <h3>{`Wallet Address: ${getWalletAddress()}`}</h3>
        {CurrentConfig.env === Environment.WALLET_EXTENSION && !getWalletAddress() && (
          <button onClick={onConnectWallet}>Connect Wallet</button>
        )}
        <h3>{`Quote input amount: ${CurrentConfig.currencies.amountIn} ${CurrentConfig.currencies.in.symbol}`}</h3>
        <h3>{`Quote output amount: ${outputAmount} ${CurrentConfig.currencies.out.symbol}`}</h3>
        <button onClick={() => quote(setOutputAmount)}>
          <p>Trade</p>
        </button>
      </header>
    </div>
  )
}

export default App
