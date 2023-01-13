import React from 'react'
import { getConnection, ConnectionType } from '../connections'
import { Connector } from '@web3-react/types'

export const CoinbaseOption = ({
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
            onActivate(getConnection(ConnectionType.COINBASE_WALLET).connector)
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
}
