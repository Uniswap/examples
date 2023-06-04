import React, { useState, useCallback, useEffect } from 'react'
import './Example.css'
import { CurrentConfig } from '../config'
import { getFullPool, BarChartTick } from '../libs/pool-data'
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts'
import { Pool } from '@uniswap/v3-sdk'

export interface PoolData {
  pool: Pool
  ticks: BarChartTick[]
}

const Example = () => {
  const [poolData, setPool] = useState<PoolData | undefined>()

  const onReload = useCallback(async () => {
    setPool(undefined)
    setPool(await getFullPool())
  }, [])

  useEffect(() => {
    getFullPool().then((data) => setPool(data))
  }, [])

  return (
    <div className="App">
      {CurrentConfig.rpc.mainnet === '' && (
        <h2 className="error">Please set your mainnet RPC URL in config.ts</h2>
      )}
      <div className="pool-data">
        <h1>Pool</h1>
        <h2>
          {poolData?.pool.token0.symbol} / {poolData?.pool.token1.symbol}
        </h2>
        <h2>Liquidity density:</h2>
      </div>
      <ResponsiveContainer width="80%" height={400}>
        {poolData !== undefined ? (
          <BarChart
            width={500}
            height={800}
            data={poolData.ticks}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 60,
            }}
            barGap={0}>
            <Bar
              dataKey="liquidityActive"
              fill="#2172E5"
              isAnimationActive={false}>
              {poolData.ticks?.map((entry, index) => {
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isCurrent ? '#F51E87' : '#2172E5'}
                  />
                )
              })}
            </Bar>
          </BarChart>
        ) : (
          <p>Loading ...</p>
        )}
      </ResponsiveContainer>
      {poolData !== undefined ? (
        <button onClick={onReload} className="btn">
          <p>Update</p>
        </button>
      ) : (
        <button className="btn-inactive">
          <p>Loading</p>
        </button>
      )}
    </div>
  )
}

export default Example
