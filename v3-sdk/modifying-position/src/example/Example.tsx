import React, { useCallback, useEffect, useState } from 'react'
import './Example.css'
import { NonfungiblePositionManager } from '@uniswap/v3-sdk'
import { Percent, CurrencyAmount } from '@uniswap/sdk-core'
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
import {
  MAX_FEE_PER_GAS,
  MAX_PRIORITY_FEE_PER_GAS,
  NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS,
  DAI_TOKEN,
  USDC_TOKEN,
} from '../libs/constants'

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

  // get calldata for minting a position
  const { calldata, value } = NonfungiblePositionManager.addCallParameters(
    await getPosition(),
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

async function addLiquidity(positionId: number): Promise<TransactionState> {
  const address = getWalletAddress()
  const provider = getProvider()
  if (!address || !provider) {
    return TransactionState.Failed
  }

  const positionToIncreaseBy = await getPosition(
    CurrentConfig.tokens.percentageToAdd
  )

  // get calldata for increasing a position
  const { calldata, value } = NonfungiblePositionManager.addCallParameters(
    positionToIncreaseBy,
    {
      deadline: Math.floor(Date.now() / 1000) + 60 * 20,
      slippageTolerance: new Percent(50, 10_000),
      tokenId: positionId,
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

async function removeLiquidity(positionId: number): Promise<TransactionState> {
  const address = getWalletAddress()
  const provider = getProvider()
  if (!address || !provider) {
    return TransactionState.Failed
  }

  const currentPosition = await getPosition()

  // get calldata for minting a position
  const { calldata, value } = NonfungiblePositionManager.removeCallParameters(
    currentPosition,
    {
      deadline: Math.floor(Date.now() / 1000) + 60 * 20,
      slippageTolerance: new Percent(50, 10_000),
      tokenId: positionId,
      // percentage of liquidity to remove
      liquidityPercentage: new Percent(CurrentConfig.tokens.percentageToRemove),
      collectOptions: {
        expectedCurrencyOwed0: CurrencyAmount.fromRawAmount(DAI_TOKEN, 0),
        expectedCurrencyOwed1: CurrencyAmount.fromRawAmount(USDC_TOKEN, 0),
        recipient: address,
      },
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
  const [positionIds, setPositionIds] = useState<number[]>([])
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

  const onAddLiquidity = useCallback(async (position: number) => {
    setTxState(TransactionState.Sending)
    setTxState(await addLiquidity(position))
  }, [])

  const onRemoveLiquidity = useCallback(async (position: number) => {
    setTxState(TransactionState.Sending)
    setTxState(await removeLiquidity(position))
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
        <h3>{`${CurrentConfig.tokens.token0.symbol} Balance: ${tokenInBalance}`}</h3>
        <h3>{`${CurrentConfig.tokens.token1.symbol} Balance: ${tokenOutBalance}`}</h3>
        <h3>{`Position Ids: ${positionIds}`}</h3>
        <button
          className="button"
          onClick={onMintPosition}
          disabled={
            txState === TransactionState.Sending ||
            getProvider() === null ||
            CurrentConfig.rpc.mainnet === ''
          }>
          <p>Mint Position</p>
        </button>
        <button
          className="button"
          onClick={() => {
            onAddLiquidity(positionIds[positionIds.length - 1])
          }}
          disabled={
            txState === TransactionState.Sending ||
            getProvider() === null ||
            CurrentConfig.rpc.mainnet === '' ||
            positionIds.length === 0
          }>
          <p>Add Liquidity to Position</p>
        </button>
        <button
          className="button"
          onClick={() => {
            onRemoveLiquidity(positionIds[positionIds.length - 1])
          }}
          disabled={
            txState === TransactionState.Sending ||
            getProvider() === null ||
            CurrentConfig.rpc.mainnet === '' ||
            positionIds.length === 0
          }>
          <p>Remove Liquidity from Position</p>
        </button>
      </header>
    </div>
  )
}

export default Example
