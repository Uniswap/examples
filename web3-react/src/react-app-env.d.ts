/// <reference types="react-scripts" />

declare global {
  interface Window {
    ethereum?: {
      // value that is populated and returns true by the Coinbase Wallet mobile dapp browser
      isCoinbaseWallet?: true
      isMetaMask?: true
    }
  }
}
