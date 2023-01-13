import { Connector } from '@web3-react/types'
import React from 'react'
import {
  getHasMetaMaskExtensionInstalled,
  getConnection,
  ConnectionType,
} from '../connections'
import { METAMASK_URL } from '../constants'

type ConnectOptionsParams = {
  connectionType: ConnectionType | null
  isActive: boolean
  onActivate: (connector: Connector) => Promise<void>
  onDeactivate: (connector: Connector) => Promise<void>
}

export const ConnectionOptions = ({
  connectionType,
  isActive,
  onActivate,
  onDeactivate,
}: ConnectOptionsParams) => {
  function getOptions(isActive: boolean) {
    const hasMetaMaskExtension = getHasMetaMaskExtensionInstalled()

    let meteMaskOption
    if (!hasMetaMaskExtension) {
      meteMaskOption = (
        <a href={METAMASK_URL}>
          <button>Install Metamask</button>
        </a>
      )
    } else {
      meteMaskOption = (
        <div>
          {((isActive &&
            (connectionType === ConnectionType.NETWORK || !connectionType)) ||
            !isActive) && (
            <button
              onClick={() => {
                onActivate(getConnection(ConnectionType.INJECTED).connector)
              }}>
              Connect Metamask
            </button>
          )}
          {isActive && connectionType === ConnectionType.INJECTED && (
            <button
              onClick={() => {
                onDeactivate(getConnection(ConnectionType.INJECTED).connector)
              }}>
              Disconnect Metamask
            </button>
          )}
        </div>
      )
    }

    const coinbaseWalletOption = (
      <div>
        {((isActive &&
          (connectionType === ConnectionType.NETWORK || !connectionType)) ||
          !isActive) && (
          <button
            onClick={() => {
              onActivate(
                getConnection(ConnectionType.COINBASE_WALLET).connector
              )
            }}>
            Connect Coinbase
          </button>
        )}
        {isActive && connectionType === ConnectionType.COINBASE_WALLET && (
          <button
            onClick={() => {
              onDeactivate(
                getConnection(ConnectionType.COINBASE_WALLET).connector
              )
            }}>
            Disconnect Coinbase
          </button>
        )}
      </div>
    )

    const walletConnectOption = (
      <div>
        {((isActive &&
          (connectionType === ConnectionType.NETWORK || !connectionType)) ||
          !isActive) && (
          <button
            onClick={() => {
              onActivate(getConnection(ConnectionType.WALLET_CONNECT).connector)
            }}>
            Connect WalletConnect
          </button>
        )}
        {isActive && connectionType === ConnectionType.WALLET_CONNECT && (
          <button
            onClick={() => {
              onDeactivate(
                getConnection(ConnectionType.WALLET_CONNECT).connector
              )
            }}>
            Disconnect WalletConnect
          </button>
        )}
      </div>
    )

    return (
      <>
        {meteMaskOption}
        {coinbaseWalletOption}
        {walletConnectOption}
      </>
    )
  }

  return <div className="connectors">{getOptions(isActive)}</div>
}
