import React from 'react'

import { ConnectionType, getHasMetaMaskExtensionInstalled } from '../connections'
import { METAMASK_URL } from '../constants'
import { Option } from './Option'

type ConnectOptionsParams = {
  activeConnectionType: ConnectionType | null
  isActive: boolean
  onActivate: (connectionType: ConnectionType) => void
  onDeactivate: (connectionType: null) => void
}

const getIsOptionConnected =
  (isActive: boolean, activeConnectionType: ConnectionType | null) => (connectionType: ConnectionType) =>
    isActive && connectionType == activeConnectionType

export const ConnectionOptions = ({
  activeConnectionType,
  isActive,
  onActivate,
  onDeactivate,
}: ConnectOptionsParams) => {
  function getOptions(isActive: boolean) {
    const hasMetaMaskExtension = getHasMetaMaskExtensionInstalled()

    const isOptionConnected = getIsOptionConnected(isActive, activeConnectionType)
    const isNoOptionActive = !isActive || (isActive && activeConnectionType === null)

    const metaMaskOption = hasMetaMaskExtension ? (
      <Option
        isDisabled={!isOptionConnected(ConnectionType.INJECTED) && !isNoOptionActive}
        isConnected={isOptionConnected(ConnectionType.INJECTED)}
        connectionType={ConnectionType.INJECTED}
        onActivate={onActivate}
        onDeactivate={onDeactivate}
      />
    ) : (
      <a href={METAMASK_URL}>
        <button>Install Metamask</button>
      </a>
    )

    const coinbaseWalletOption = (
      <Option
        isDisabled={!isOptionConnected(ConnectionType.COINBASE_WALLET) && !isNoOptionActive}
        isConnected={isOptionConnected(ConnectionType.COINBASE_WALLET)}
        connectionType={ConnectionType.COINBASE_WALLET}
        onActivate={onActivate}
        onDeactivate={onDeactivate}
      />
    )

    const walletConnectOption = (
      <Option
        isDisabled={!isOptionConnected(ConnectionType.WALLET_CONNECT) && !isNoOptionActive}
        isConnected={isOptionConnected(ConnectionType.WALLET_CONNECT)}
        connectionType={ConnectionType.WALLET_CONNECT}
        onActivate={onActivate}
        onDeactivate={onDeactivate}
      />
    )

    return (
      <>
        {metaMaskOption}
        {coinbaseWalletOption}
        {walletConnectOption}
      </>
    )
  }

  return <div className="connectors">{getOptions(isActive)}</div>
}
