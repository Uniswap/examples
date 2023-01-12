import { CoinbaseWallet } from '@web3-react/coinbase-wallet'
import { initializeConnector, Web3ReactHooks } from '@web3-react/core'
import { GnosisSafe } from '@web3-react/gnosis-safe'
import { MetaMask } from '@web3-react/metamask'
import { Network } from '@web3-react/network'
import { Connector } from '@web3-react/types'
import { CurrentConfig } from '../config'
import { JsonRpcProvider } from '@ethersproject/providers'
import { SupportedChainId } from '@uniswap/sdk-core'

export function getIsInjected(): boolean {
  return Boolean(window.ethereum)
}

export function getHasMetaMaskExtensionInstalled(): boolean {
  return window.ethereum?.isMetaMask ?? false
}

export function getHasCoinbaseExtensionInstalled(): boolean {
  return window.ethereum?.isCoinbaseWallet ?? false
}

export interface Connection {
  connector: Connector
  hooks: Web3ReactHooks
}

let metaMaskErrorHandler: (error: Error) => void | undefined

export function setMetMaskErrorHandler(errorHandler: (error: Error) => void) {
  metaMaskErrorHandler = errorHandler
}

function onError(error: Error) {
  console.debug(`web3-react error: ${error}`)
}

function onMetamaskError(error: Error) {
  onError(error)
  metaMaskErrorHandler?.(error)
}

const [web3Network, web3NetworkHooks] = initializeConnector<Network>(
  (actions) =>
    new Network({
      actions,
      urlMap: {
        [SupportedChainId.MAINNET]: new JsonRpcProvider(
          CurrentConfig.rpc.mainnet
        ),
      },
      defaultChainId: 1,
    })
)
export const networkConnection: Connection = {
  connector: web3Network,
  hooks: web3NetworkHooks,
}

const [web3MetamaskWallet, web3MetamaskWalletHooks] =
  initializeConnector<MetaMask>(
    (actions) => new MetaMask({ actions, onError: onMetamaskError })
  )
export const injectedConnection: Connection = {
  connector: web3MetamaskWallet,
  hooks: web3MetamaskWalletHooks,
}

const [web3GnosisSafe, web3GnosisSafeHooks] = initializeConnector<GnosisSafe>(
  (actions) => new GnosisSafe({ actions })
)
export const gnosisSafeConnection: Connection = {
  connector: web3GnosisSafe,
  hooks: web3GnosisSafeHooks,
}

const [web3CoinbaseWallet, web3CoinbaseWalletHooks] =
  initializeConnector<CoinbaseWallet>(
    (actions) =>
      new CoinbaseWallet({
        actions,
        options: {
          url: CurrentConfig.rpc.mainnet,
          appName: 'Uniswap',
          reloadOnDisconnect: false,
        },
        onError,
      })
  )
export const coinbaseWalletConnection: Connection = {
  connector: web3CoinbaseWallet,
  hooks: web3CoinbaseWalletHooks,
}
