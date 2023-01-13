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
          {connectionType !== ConnectionType.INJECTED && (
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

    return <>{meteMaskOption}</>
  }

  return <div className="connectors">{getOptions(isActive)}</div>
}
