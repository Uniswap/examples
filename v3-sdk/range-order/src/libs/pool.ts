import { CurrentConfig } from '../config'
import { getProvider } from './providers'
import { Pool } from '@uniswap/v3-sdk'
import { Price, Token } from '@uniswap/sdk-core'

export async function getPrice(): Promise<Price<Token, Token>> {
  const pool = await Pool.initFromChain(
    getProvider(),
    CurrentConfig.tokens.token0,
    CurrentConfig.tokens.token1,
    CurrentConfig.tokens.poolFee
  )

  return pool.token0Price
}
