import React from 'react'
import {
  getConnection,
  ConnectionType,
  tryActivateConnector,
  tryDeactivateConnector,
} from '../connections'

export const CoinbaseOption = ({
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
              getConnection(ConnectionType.COINBASE_WALLET).connector,
              onActivate
            )
          }}>
          Connect Coinbase
        </button>
      )}
      {isActive && connectionType === ConnectionType.COINBASE_WALLET && (
        <button
          onClick={() => {
            tryDeactivateConnector(
              getConnection(ConnectionType.COINBASE_WALLET).connector,
              onDeactivate
            )
          }}>
          Disconnect Coinbase
        </button>
      )}
    </div>
  )
}
