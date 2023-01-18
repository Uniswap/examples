import React from 'react'
import {
  getHasMetaMaskExtensionInstalled,
  ConnectionType,
} from '../connections'
import { METAMASK_URL } from '../constants'
import { Option } from './Option'

type ConnectOptionsParams = {
  connectionType: ConnectionType | null
  isActive: boolean
  onActivate: (connectionType: ConnectionType) => void
  onDeactivate: (connectionType: null) => void
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
        <Option
          isActive={isActive}
          activeConnectionType={connectionType}
          connectionType={ConnectionType.INJECTED}
          onActivate={onActivate}
          onDeactivate={onDeactivate}
        />
      )
    }

    const coinbaseWalletOption = (
      <Option
        isActive={isActive}
        activeConnectionType={connectionType}
        connectionType={ConnectionType.COINBASE_WALLET}
        onActivate={onActivate}
        onDeactivate={onDeactivate}
      />
    )

    const walletConnectOption = (
      <Option
        isActive={isActive}
        activeConnectionType={connectionType}
        connectionType={ConnectionType.WALLET_CONNECT}
        onActivate={onActivate}
        onDeactivate={onDeactivate}
      />
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
