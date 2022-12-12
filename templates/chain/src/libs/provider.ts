import { ethers, providers } from 'ethers'
import { ChainEnvironment, CurrentConfig } from '../config'

// Set up providers and wallet
export const rpcProvider = new ethers.providers.JsonRpcProvider(CurrentConfig.rpc.mainnet)
export const localRpcProvider = new ethers.providers.JsonRpcProvider(CurrentConfig.rpc.local)
export const wallet = createWallet(localRpcProvider, rpcProvider)
export const windowProvider = createWindowProvider()

// Library of functions

export function createWallet(localProvider: providers.Provider, productionProvider: providers.Provider): ethers.Wallet {
  const wallet = new ethers.Wallet(
    CurrentConfig.wallet.privateKey,
    CurrentConfig.env == ChainEnvironment.LOCAL ? localProvider : productionProvider
  )
  return wallet
}

// TODO handle no wallet existing
export function createWindowProvider(): ethers.providers.Web3Provider {
  return new ethers.providers.Web3Provider(window?.ethereum, 'any')
}

export async function connectWallet() {
  if (!window.ethereum) {
    return null
  }

  const { ethereum } = window
  const provider = new ethers.providers.Web3Provider(ethereum)
  const accounts = await provider.send('eth_requestAccounts', [])

  return accounts
}

export enum TransactionState {
  Failed = 'Failed',
  New = 'New',
  Rejected = 'Rejected',
  Sending = 'Sending',
  Success = 'Success',
}

export async function sendTransaction(transaction: ethers.providers.TransactionRequest): Promise<TransactionState> {
  if (CurrentConfig.env !== ChainEnvironment.WALLET_EXTENSION) {
    const res = await wallet.sendTransaction(transaction)
    const txReceipt = await res.wait()

    // Transaction was successful if status === 1
    if (txReceipt.status === 1) {
      return TransactionState.Success
    } else {
      return TransactionState.Failed
    }
  } else {
    try {
      const receipt = await windowProvider?.send('eth_sendTransaction', [transaction])
      if (receipt) {
        return TransactionState.Success
      } else {
        return TransactionState.Failed
      }
    } catch (e) {
      console.log(e)
      console.log(transaction.from)
      return TransactionState.Rejected
    }
  }
}
