import React from 'react'
import {
  getConnection,
  ConnectionType,
  tryActivateConnector,
  tryDeactivateConnector,
} from '../connections'

export const MetaMaskOption = ({
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
              getConnection(ConnectionType.INJECTED).connector,
              onActivate
            )
          }}>
          Connect Metamask
        </button>
      )}
      {isActive && connectionType === ConnectionType.INJECTED && (
        <button
          onClick={() => {
            tryDeactivateConnector(
              getConnection(ConnectionType.INJECTED).connector,
              onDeactivate
            )
          }}>
          Disconnect Metamask
        </button>
      )}
    </div>
  )
}
