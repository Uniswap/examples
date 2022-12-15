// This file contains code to easily connect to and get information from a wallet on chain

import { Currency } from '@uniswap/sdk-core'
import { ethers } from 'ethers'
import { providers } from 'ethers'
import { ERC20_ABI, ERC721_ABI } from './constants'
import { toReadableAmount } from './conversion'

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
  const currencyContract = new ethers.Contract(
    currency.address,
    ERC20_ABI,
    provider
  )
  const balance: number = await currencyContract.balanceOf(address)
  const decimals: number = await currencyContract.decimals()

  // Format with proper units (approximate)
  return toReadableAmount(balance, decimals).toString()
}

export async function getAssetBalance(
  provider: providers.Provider,
  address: string,
  contractAddress: string
): Promise<string> {
  // Get currency otherwise
  const assetContract = new ethers.Contract(
    contractAddress,
    ERC721_ABI,
    provider
  )
  const balance: number = await assetContract.balanceOf(address)

  // Format with proper units (approximate)
  return balance.toString()
}
