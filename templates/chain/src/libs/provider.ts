import { ethers, providers } from 'ethers'
import { Environment, CurrentConfig } from '../config'
import { BaseProvider } from '@ethersproject/providers'

// Single copies of provider and wallet
const rpcProvider = new ethers.providers.JsonRpcProvider(CurrentConfig.rpc.mainnet)
const localRpcProvider = new ethers.providers.JsonRpcProvider(CurrentConfig.rpc.local)

const wallet = createWallet(localRpcProvider, rpcProvider)

const windowProvider = createWindowProvider()
let walletExtensionAddress: string | null = null

// Interfaces

export enum TransactionState {
  Failed = 'Failed',
  New = 'New',
  Rejected = 'Rejected',
  Sending = 'Sending',
  Sent = 'Sent',
}

// Provider and Wallet Functions

export function getMainnetProvider(): BaseProvider {
  return rpcProvider
}

export function getProvider(): providers.Provider | null {
  return CurrentConfig.env === Environment.WALLET_EXTENSION ? windowProvider : wallet.provider
}

export function getWalletAddress(): string | null {
  return CurrentConfig.env === Environment.WALLET_EXTENSION ? walletExtensionAddress : wallet.address
}

export async function sendTransaction(transaction: ethers.providers.TransactionRequest): Promise<TransactionState> {
  if (CurrentConfig.env === Environment.WALLET_EXTENSION) {
    // Transacting with a wallet extension via a Web3 Provider
    try {
      const receipt = await windowProvider?.send('eth_sendTransaction', [transaction])
      if (receipt) {
        return TransactionState.Sent
      } else {
        return TransactionState.Failed
      }
    } catch (e) {
      console.log(e)
      return TransactionState.Rejected
    }
  } else {
    // Transacting using an ethers.Wallet
    const res = await wallet.sendTransaction(transaction)
    const txReceipt = await res.wait()

    // Transaction was successful if status === 1
    if (txReceipt.status === 1) {
      return TransactionState.Sent
    } else {
      return TransactionState.Failed
    }
  }
}

export async function connectWallet() {
  if (!window.ethereum) {
    return null
  }

  const { ethereum } = window
  const provider = new ethers.providers.Web3Provider(ethereum)
  const accounts = await provider.send('eth_requestAccounts', [])

  if (accounts.length !== 1) {
    return
  }

  walletExtensionAddress = accounts[0]
}

// Internal Constructors

function createWallet(localProvider: providers.Provider, productionProvider: providers.Provider): ethers.Wallet {
  const wallet = new ethers.Wallet(
    CurrentConfig.wallet.privateKey,
    CurrentConfig.env == Environment.LOCAL ? localProvider : productionProvider
  )
  return wallet
}

// TODO handle no wallet existing
function createWindowProvider(): ethers.providers.Web3Provider | null {
  try {
    return new ethers.providers.Web3Provider(window?.ethereum, 'any')
  } catch (e) {
    console.log('No Wallet Extension Found')
    return null
  }
}
