// This file contains code to easily connect to and get information from a wallet on chain

import { Currency } from '@uniswap/sdk-core'
import { ethers } from 'ethers'

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

export async function getCurrencyBalance(wallet: ethers.Wallet, currency: Currency) {
  if (currency.isNative) {
    return ethers.utils.formatEther(await wallet.provider.getBalance(wallet.address))
  }

  const walletContract = new ethers.Contract(currency.address, ERC20_WALLET_ABI, wallet.provider)
  const balance = await walletContract.balanceOf(wallet.address)

  return balance
}
