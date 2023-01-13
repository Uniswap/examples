import { Connector } from '@web3-react/types'
import React from 'react'
import {
  getHasMetaMaskExtensionInstalled,
  getIsInjected,
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
    const isInjected = getIsInjected()
    const hasMetaMaskExtension = getHasMetaMaskExtensionInstalled()

    let meteMaskOption
    if (!isInjected) {
      meteMaskOption = (
        <a href={METAMASK_URL}>
          <button>Install Metamask</button>
        </a>
      )
    } else if (hasMetaMaskExtension) {
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

    console.log('isActive', isActive)
    console.log('connectionType', connectionType)

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

    return (
      <>
        {meteMaskOption}
        {coinbaseWalletOption}
      </>
    )
  }

  return <div className="connectors">{getOptions(isActive)}</div>
}
