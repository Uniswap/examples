import React from 'react'
import { getConnection, ConnectionType } from '../connections'
import { Connector } from '@web3-react/types'

export const MetaMaskOption = ({
  isActive,
  connectionType,
  onActivate,
  onDeactivate,
}: {
  isActive: boolean
  connectionType: ConnectionType | null
  onActivate: (connector: Connector) => Promise<void>
  onDeactivate: (connector: Connector) => Promise<void>
}) => {
  return (
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
