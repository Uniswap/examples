// This file contains code to easily connect to and get information from a wallet on chain

import { Currency } from '@uniswap/sdk-core'
import { ethers } from 'ethers'
import { Web3Provider } from '@ethersproject/providers'
import { providers } from 'ethers'

// ABI for wallet information
const ERC20_WALLET_ABI = [
  // Read-Only Functions
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',

  // Authenticated Functions
  'function transfer(address to, uint amount) returns (bool)',

  // Events
  'event Transfer(address indexed from, address indexed to, uint amount)',
]

export async function getCurrencyBalance(
  provider: Web3Provider | providers.Provider,
  address: string,
  currency: Currency
): Promise<string> {
  // Handle ETH directly
  if (currency.isNative) {
    return ethers.utils.formatEther(await provider.getBalance(address))
  }

  // Get currency otherwise
  const walletContract = new ethers.Contract(currency.address, ERC20_WALLET_ABI, provider)
  const balance: number = await walletContract.balanceOf(address)
  const decimals: number = await walletContract.decimals()

  // Format with proper units (approximate)
  return (balance / Math.pow(10, decimals)).toString()
}
