import React from 'react'
import { getConnection, ConnectionType } from '../connections'
import { Connector } from '@web3-react/types'

export const WalletConnectOption = ({
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
            onActivate(getConnection(ConnectionType.WALLET_CONNECT).connector)
          }}>
          Connect WalletConnect
        </button>
      )}
      {isActive && connectionType === ConnectionType.WALLET_CONNECT && (
        <button
          onClick={() => {
            onDeactivate(getConnection(ConnectionType.WALLET_CONNECT).connector)
          }}>
          Disconnect WalletConnect
        </button>
      )}
    </div>
  )
}
