import React, { useState, useCallback, useEffect } from 'react'
import './Example.css'
import { CurrentConfig } from '../config'
import { getFullPool } from '../libs/pool-data'
import { BarChartTick } from '../libs/interfaces'
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { Pool, tickToPrice } from '@uniswap/v3-sdk'
import { CurrencyAmount } from '@uniswap/sdk-core'

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

  const calculateLockedLiqudity = (chartTick: BarChartTick) => {
    const pool = poolData?.pool
    if (pool) {
      const price = parseFloat(
        tickToPrice(
          pool.token0,
          pool.token1,
          chartTick.tickIdx
        ).asFraction.toFixed(pool.token0.decimals)
      )
      const sqrtPrice = Math.sqrt(price)
      let totalvalueLocked0 =
        parseFloat(chartTick.liquidityActive.toString()) / sqrtPrice
      let totalValueLocked1 =
        parseFloat(chartTick.liquidityActive.toString()) * sqrtPrice

      if (chartTick.tickIdx < pool.tickCurrent) {
        const priceBefore = parseFloat(
          tickToPrice(
            pool.token0,
            pool.token1,
            chartTick.tickIdx - pool.tickSpacing
          ).asFraction.toFixed(pool.token0.decimals)
        )
        const sqrtPriceBefore = Math.sqrt(priceBefore)
        const totalvalueLocked0Before =
          parseFloat(chartTick.liquidityActive.toString()) / sqrtPriceBefore
        totalvalueLocked0 -= totalvalueLocked0Before

        return CurrencyAmount.fromRawAmount(
          pool.token0,
          Math.floor(totalvalueLocked0)
        )
      } else {
        const priceAfter = parseFloat(
          tickToPrice(
            pool.token0,
            pool.token1,
            chartTick.tickIdx + pool.tickSpacing
          ).asFraction.toFixed(pool.token0.decimals)
        )
        const sqrtPriceAfter = Math.sqrt(priceAfter)
        const totalValueLocked1After =
          parseFloat(chartTick.liquidityActive.toString()) * sqrtPriceAfter

        totalValueLocked1 -= totalValueLocked1After

        return CurrencyAmount.fromRawAmount(
          pool.token1,
          Math.floor(totalValueLocked1)
        )
      }
    } else {
      return null
    }
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload) {
      const liquidityLocked = calculateLockedLiqudity(payload[0].payload)
      if (liquidityLocked) {
        return (
          <div className="custom-tooltip">
            <p className="tooltip-label">
              Liquidity: {liquidityLocked.toSignificant(6)}
              {liquidityLocked.currency.symbol}
            </p>
            <p className="tooltip-label">
              Price {poolData?.pool.token0.symbol}: {payload[0].payload.price0}
              {poolData?.pool.token1.symbol}
            </p>
            <p className="tooltip-label">
              Price {poolData?.pool.token1.symbol}: {payload[0].payload.price1}
              {poolData?.pool.token0.symbol}
            </p>
          </div>
        )
      } else {
        return null
      }
    } else {
      return null
    }
  }

  return (
    <div className="App">
      {CurrentConfig.rpc.mainnet === '' && (
        <h2 className="error">Please set your mainnet RPC URL in config.ts</h2>
      )}
      <div className="pool-data">
        <h2>
          Pool: {poolData?.pool.token0.symbol} / {poolData?.pool.token1.symbol}
        </h2>
        <h3>Liquidity density:</h3>
      </div>
      <ResponsiveContainer width="60%" height={400}>
        {poolData !== undefined ? (
          <BarChart
            width={500}
            height={800}
            data={poolData.ticks}
            margin={{
              top: 30,
              right: 20,
              left: 20,
              bottom: 30,
            }}
            barGap={0}>
            <XAxis tick={false} />
            <YAxis
              tick={false}
              axisLine={false}
              padding={{ top: 0, bottom: 2 }}
            />
            <Tooltip isAnimationActive={true} content={<CustomTooltip />} />
            <Bar
              dataKey="liquidityActiveNumber"
              fill="#2172E5"
              isAnimationActive={true}>
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
