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
  onActivate: (connectionType: ConnectionType | undefined) => void
  onDeactivate: (connectionType: null | undefined) => void
}) => {
  return (
    <div>
      {((isActive &&
        (connectionType === ConnectionType.NETWORK || !connectionType)) ||
        !isActive) && (
        <button
          onClick={async () => {
            onActivate(
              await tryActivateConnector(
                getConnection(ConnectionType.INJECTED).connector
              )
            )
          }}>
          Connect Metamask
        </button>
      )}
      {isActive && connectionType === ConnectionType.INJECTED && (
        <button
          onClick={async () => {
            onDeactivate(
              await tryDeactivateConnector(
                getConnection(ConnectionType.INJECTED).connector
              )
            )
          }}>
          Disconnect Metamask
        </button>
      )}
    </div>
  )
}
