import React, { useCallback, useEffect, useState } from 'react'
import './Example.css'
import { Environment, CurrentConfig } from '../config'
import { Price, Token } from '@uniswap/sdk-core'
import { getProvider } from '../libs/providers'
import { getAverages } from '../libs/oracle'

const useOnBlockUpdated = (callback: (blockNumber: number) => void) => {
  useEffect(() => {
    const subscription = getProvider()?.on('block', callback)
    return () => {
      subscription?.removeAllListeners()
    }
  })
}

const Example = () => {
  const [TWAP, setTwap] = useState<Price<Token, Token>>()
  const [TWAL, setTwal] = useState<bigint>()
  const [blockNumber, setBlockNumber] = useState<number>(0)

  // Listen for new blocks and update the wallet
  useOnBlockUpdated(async (blockNumber: number) => {
    refreshObservations()
    setBlockNumber(blockNumber)
  })

  useEffect(() => {
    getAverages().then((tuple) => {
      setTwal(tuple.twal)
      setTwap(tuple.twap)
    })
  }, [])

  // Update observations every block
  const refreshObservations = useCallback(async () => {
    const { twap, twal } = await getAverages()

    setTwap(twap)
    setTwal(twal)
  }, [])

  return (
    <div className="App">
      {CurrentConfig.rpc.mainnet === '' &&
        CurrentConfig.env === Environment.MAINNET && (
          <h2 className="error">
            Please set your mainnet RPC URL in config.ts
          </h2>
        )}
      <h3>{`Block Number: ${blockNumber + 1}`}</h3>
      <h3>Time weighted average liqudity:</h3>
      <p>{TWAL === undefined ? 'Fetching...' : TWAL.toString()}</p>
      <h3>Time weighted average Price:</h3>
      <div>
        {TWAP === undefined
          ? 'Fetching...'
          : '1.0 ' +
            TWAP.baseCurrency.symbol +
            ' = ' +
            TWAP.toSignificant(6) +
            ' ' +
            TWAP.quoteCurrency.symbol}
      </div>
      <div>
        {TWAP === undefined
          ? 'Fetching...'
          : '1.0 ' +
            TWAP.quoteCurrency.symbol +
            ' = ' +
            TWAP.invert().toSignificant(6) +
            ' ' +
            TWAP.baseCurrency.symbol}
      </div>
      <h4>
        Observed averages over the last{' '}
        {Math.floor(CurrentConfig.timeInterval / CurrentConfig.blockTime) + 1}{' '}
        blocks
      </h4>
    </div>
  )
}

export default Example
