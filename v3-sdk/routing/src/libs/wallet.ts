// This file contains code to easily connect to and get information from a wallet on chain

import { Currency } from '@uniswap/sdk-core'
import { ethers } from 'ethers'
import { providers } from 'ethers'
import { ERC20_ABI } from './constants'
import { toReadableAmount } from './utils'

export async function getCurrencyBalance(
  provider: providers.Provider,
  address: string,
  currency: Currency
): Promise<string> {
  // Handle ETH directly
  if (currency.isNative) {
    return ethers.utils.formatEther(await provider.getBalance(address))
  }

  // Get currency otherwise
  const walletContract = new ethers.Contract(
    currency.address,
    ERC20_ABI,
    provider
  )
  const balance: number = await walletContract.balanceOf(address)
  const decimals: number = await walletContract.decimals()

  // Format with proper units (approximate)
  return toReadableAmount(balance, decimals).toString()
}
