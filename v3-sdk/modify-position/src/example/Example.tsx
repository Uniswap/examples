import React, { useCallback, useEffect, useState } from 'react'
import './Example.css'
import { ethers } from 'ethers'
import {
  Pool,
  computePoolAddress,
  Position,
  nearestUsableTick,
  NonfungiblePositionManager,
} from '@uniswap/v3-sdk'
import { Percent } from '@uniswap/sdk-core'
import { Environment, CurrentConfig } from '../config'
import { getCurrencyBalance } from '../libs/balance'
import { getPositionIds, getTokenTransferApprovals } from '../libs/positions'
import {
  connectBrowserExtensionWallet,
  getProvider,
  TransactionState,
  sendTransaction,
  getWalletAddress,
} from '../libs/providers'
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import {
  POOL_FACTORY_CONTRACT_ADDRESS,
  MAX_FEE_PER_GAS,
  MAX_PRIORITY_FEE_PER_GAS,
  NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
} from '../libs/constants'
import { fromReadableAmount } from '../libs/conversion'

interface PoolInfo {
  token0: string
  token1: string
  fee: number
  tickSpacing: number
  sqrtPriceX96: ethers.BigNumber
  liquidity: ethers.BigNumber
  tick: number
}

const getPoolInfo = async (): Promise<PoolInfo> => {
  const provider = getProvider()
  if (!provider) {
    throw new Error('No provider')
  }

  const currentPoolAddress = computePoolAddress({
    factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
    tokenA: CurrentConfig.tokens.token0,
    tokenB: CurrentConfig.tokens.token1,
    fee: CurrentConfig.tokens.poolFee,
  })

  const poolContract = new ethers.Contract(
    currentPoolAddress,
    IUniswapV3PoolABI.abi,
    provider
  )

  const [token0, token1, fee, tickSpacing, liquidity, slot0] =
    await Promise.all([
      poolContract.token0(),
      poolContract.token1(),
      poolContract.fee(),
      poolContract.tickSpacing(),
      poolContract.liquidity(),
      poolContract.slot0(),
    ])

  return {
    token0,
    token1,
    fee,
    tickSpacing,
    liquidity,
    sqrtPriceX96: slot0[0],
    tick: slot0[1],
  }
}

async function mintPosition(): Promise<TransactionState> {
  const address = getWalletAddress()
  const provider = getProvider()
  if (!address || !provider) {
    return TransactionState.Failed
  }
  // Give approval to the contract to transfer tokens
  const tokenInApproval = await getTokenTransferApprovals(
    provider,
    CurrentConfig.tokens.token0.address,
    address,
    NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS
  )
  const tokenOutApproval = await getTokenTransferApprovals(
    provider,
    CurrentConfig.tokens.token1.address,
    address,
    NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS
  )

  if (
    tokenInApproval !== TransactionState.Sent ||
    tokenOutApproval !== TransactionState.Sent
  ) {
    return TransactionState.Failed
  }

  // get pool data
  const poolInfo = await getPoolInfo()

  // create Pool abstraction
  const USDC_DAI_POOL = new Pool(
    CurrentConfig.tokens.token0,
    CurrentConfig.tokens.token1,
    poolInfo.fee,
    poolInfo.sqrtPriceX96.toString(),
    poolInfo.liquidity.toString(),
    poolInfo.tick
  )

  // create position using the maximum liquidity from input amounts
  const position = Position.fromAmounts({
    pool: USDC_DAI_POOL,
    tickLower:
      nearestUsableTick(poolInfo.tick, poolInfo.tickSpacing) -
      poolInfo.tickSpacing * 2,
    tickUpper:
      nearestUsableTick(poolInfo.tick, poolInfo.tickSpacing) +
      poolInfo.tickSpacing * 2,
    amount0: fromReadableAmount(
      CurrentConfig.tokens.token0Amount,
      CurrentConfig.tokens.token0.decimals
    ),
    amount1: fromReadableAmount(
      CurrentConfig.tokens.token1Amount,
      CurrentConfig.tokens.token1.decimals
    ),
    useFullPrecision: true,
  })

  // get calldata for minting a position
  const { calldata, value } = NonfungiblePositionManager.addCallParameters(
    position,
    {
      recipient: address,
      deadline: Math.floor(Date.now() / 1000) + 60 * 20,
      slippageTolerance: new Percent(50, 10_000),
    }
  )

  // build transaction
  const transaction = {
    data: calldata,
    to: NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
    value: value,
    from: address,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
  }

  await sendTransaction(transaction)
  return TransactionState.Sent
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
  const [positionIds, setPositionIds] = useState<number[]>()
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
    if (!provider || !address) {
      throw new Error('No provider or address')
    }
    setTokenInBalance(
      await getCurrencyBalance(provider, address, CurrentConfig.tokens.token0)
    )
    setTokenOutBalance(
      await getCurrencyBalance(provider, address, CurrentConfig.tokens.token1)
    )
    setPositionIds(
      await getPositionIds(
        provider,
        address,
        NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS
      )
    )
  }, [])

  // Event Handlers

  const onConnectWallet = useCallback(async () => {
    if (await connectBrowserExtensionWallet()) {
      refreshBalances()
    }
  }, [refreshBalances])

  const onMintPosition = useCallback(async () => {
    setTxState(TransactionState.Sending)
    setTxState(await mintPosition())
  }, [])

  const onIncreasePosition = useCallback(async () => {
    setTxState(TransactionState.Sending)
    setTxState(await mintPosition())
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        {CurrentConfig.rpc.mainnet === '' && (
          <h2 className="error">
            Please set your mainnet RPC URL in config.ts
          </h2>
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
        <h3>{`Token In ${CurrentConfig.tokens.token0.symbol} Balance: ${tokenInBalance}`}</h3>
        <h3>{`Token Out ${CurrentConfig.tokens.token1.symbol} Balance: ${tokenOutBalance}`}</h3>
        <h3>{`Position Ids: ${positionIds}`}</h3>
        <button
          onClick={() => onMintPosition()}
          disabled={
            txState === TransactionState.Sending ||
            getProvider() === null ||
            CurrentConfig.rpc.mainnet === ''
          }>
          <p>Mint Position</p>
        </button>
        <button
          onClick={() => onMintPosition()}
          disabled={
            txState === TransactionState.Sending ||
            getProvider() === null ||
            CurrentConfig.rpc.mainnet === ''
          }>
          <p>Increase Position</p>
        </button>
      </header>
    </div>
  )
}

export default Example
