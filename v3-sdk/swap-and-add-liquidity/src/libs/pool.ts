import { CurrentConfig } from '../config'
import { getProvider } from '../libs/providers'
import { Pool } from '@uniswap/v3-sdk'

export async function getPool(): Promise<Pool> {
  const provider = getProvider()
  if (!provider) {
    throw new Error('No provider')
  }

  return Pool.initFromChain({
    provider,
    tokenA: CurrentConfig.tokens.token0,
    tokenB: CurrentConfig.tokens.token1,
    fee: CurrentConfig.tokens.poolFee,
  })
}
