import { ethers, providers, BigNumber, Wallet } from 'ethers'
import { CurrentConfig } from '../config'

const wallet = createWallet()

// Interfaces

export enum TransactionState {
  Failed = 'Failed',
  New = 'New',
  Rejected = 'Rejected',
  Sending = 'Sending',
  Sent = 'Sent',
}

// Provider and Wallet Functions

export function getProvider(): providers.Provider {
  return wallet.provider
}

export function getWalletAddress(): string | null {
  return wallet.address
}

export function getWallet(): Wallet {
  return wallet
}

export async function sendTransaction(
  transaction: ethers.providers.TransactionRequest
): Promise<TransactionState> {
  return sendTransactionViaWallet(transaction)
}

// Internal Functionality

function createWallet(): ethers.Wallet {
  const provider = new ethers.providers.JsonRpcProvider(CurrentConfig.rpc.local)

  return new ethers.Wallet(CurrentConfig.wallet.privateKey, provider)
}

async function sendTransactionViaWallet(
  transaction: ethers.providers.TransactionRequest
): Promise<TransactionState> {
  if (transaction.value) {
    transaction.value = BigNumber.from(transaction.value)
  }
  const txRes = await wallet.sendTransaction(transaction)

  let receipt = null
  const provider = getProvider()
  if (!provider) {
    return TransactionState.Failed
  }

  while (receipt === null) {
    try {
      receipt = await provider.getTransactionReceipt(txRes.hash)

      if (receipt === null) {
        continue
      } else {
        const jsonrpcprovider = new ethers.providers.JsonRpcProvider(
          CurrentConfig.rpc.local
        )
        const _res = await jsonrpcprovider.send('trace_transaction', [
          txRes.hash,
        ])
      }
    } catch (e) {
      console.log(`Receipt error:`, e)
      break
    }
  }

  // Transaction was successful if status === 1
  if (receipt) {
    return TransactionState.Sent
  } else {
    return TransactionState.Failed
  }
}
