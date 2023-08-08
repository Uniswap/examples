import { FeeAmount, Pool, Tick } from '@uniswap/v3-sdk'
import { ethers } from 'ethers'
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json' assert { type: 'json' }
import { CurrentConfig } from '../config.js'
import { getProvider } from './providers.js'
import { Token } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import { Contract, Provider } from 'ethers-multicall'

export interface PoolData {
  address: string
  tokenA: Token
  tokenB: Token
  fee: FeeAmount
  sqrtPriceX96: JSBI
  liquidity: JSBI
  tick: number
  tickSpacing: number
}

export async function getPoolData(blockNum: number): Promise<PoolData> {
  const poolAddress = Pool.getAddress(
    CurrentConfig.pool.token0,
    CurrentConfig.pool.token1,
    CurrentConfig.pool.fee
  )
  const poolContract = new ethers.Contract(
    poolAddress,
    IUniswapV3PoolABI.abi,
    getProvider()
  )

  const [slot0, liquidity, tickSpacing] = await Promise.all([
    poolContract.slot0({
      blockTag: blockNum,
    }),
    poolContract.liquidity({
      blockTag: blockNum,
    }),
    poolContract.tickSpacing({
      blockTag: blockNum,
    }),
  ])
  return {
    address: poolAddress,
    tokenA: CurrentConfig.pool.token0,
    tokenB: CurrentConfig.pool.token1,
    fee: CurrentConfig.pool.fee,
    sqrtPriceX96: JSBI.BigInt(slot0.sqrtPriceX96.toString()),
    liquidity: JSBI.BigInt(liquidity.toString()),
    tick: parseInt(slot0.tick),
    tickSpacing: tickSpacing,
  }
}

export async function getTickIndicesInWordRange(
  poolAddress: string,
  tickSpacing: number,
  startWord: number,
  endWord: number
): Promise<number[]> {
  const multicallProvider = new Provider(getProvider())
  await multicallProvider.init()
  const poolContract = new Contract(poolAddress, IUniswapV3PoolABI.abi)

  const calls: any[] = []
  const wordPosIndices: number[] = []

  for (let i = startWord; i <= endWord; i++) {
    wordPosIndices.push(i)
    calls.push(poolContract.tickBitmap(i))
  }

  const results: bigint[] = (await multicallProvider.all(calls)).map(
    (ethersResponse) => {
      return BigInt(ethersResponse.toString())
    }
  )

  const tickIndices: number[] = []

  for (let j = 0; j < wordPosIndices.length; j++) {
    const ind = wordPosIndices[j]
    const bitmap = results[j]

    if (bitmap !== 0n) {
      for (let i = 0; i < 256; i++) {
        const bit = 1n
        const initialized = (bitmap & (bit << BigInt(i))) !== 0n
        if (initialized) {
          const tickIndex = (ind * 256 + i) * tickSpacing
          tickIndices.push(tickIndex)
        }
      }
    }
  }

  return tickIndices
}

export async function getAllTicks(
  poolAddress: string,
  tickIndices: number[]
): Promise<Tick[]> {
  const multicallProvider = new Provider(getProvider())
  await multicallProvider.init()
  const poolContract = new Contract(poolAddress, IUniswapV3PoolABI.abi)

  const calls: any[] = []

  for (const index of tickIndices) {
    calls.push(poolContract.ticks(index))
  }

  const results = await multicallProvider.all(calls)
  const allTicks: Tick[] = []

  for (let i = 0; i < tickIndices.length; i++) {
    const index = tickIndices[i]
    const ethersResponse = results[i]
    const tick = new Tick({
      index,
      liquidityGross: JSBI.BigInt(ethersResponse.liquidityGross.toString()),
      liquidityNet: JSBI.BigInt(ethersResponse.liquidityNet.toString()),
    })
    allTicks.push(tick)
  }
  return allTicks
}
