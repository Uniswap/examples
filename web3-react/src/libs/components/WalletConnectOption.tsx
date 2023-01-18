import React from 'react'
import {
  getConnection,
  ConnectionType,
  tryActivateConnector,
  tryDeactivateConnector,
} from '../connections'

export const WalletConnectOption = ({
  isActive,
  connectionType,
  onActivate,
  onDeactivate,
}: {
  isActive: boolean
  connectionType: ConnectionType | null
  onActivate: (connectionType: ConnectionType) => void
  onDeactivate: (connectionType: ConnectionType | null) => void
}) => {
  return (
    <div>
      {((isActive &&
        (connectionType === ConnectionType.NETWORK || !connectionType)) ||
        !isActive) && (
        <button
          onClick={() => {
            tryActivateConnector(
              getConnection(ConnectionType.WALLET_CONNECT).connector,
              onActivate
            )
          }}>
          Connect WalletConnect
        </button>
      )}
      {isActive && connectionType === ConnectionType.WALLET_CONNECT && (
        <button
          onClick={() => {
            tryDeactivateConnector(
              getConnection(ConnectionType.WALLET_CONNECT).connector,
              onDeactivate
            )
          }}>
          Disconnect WalletConnect
        </button>
      )}
    </div>
  )
}
