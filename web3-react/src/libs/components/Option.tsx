import React from 'react'
import {
  getConnection,
  ConnectionType,
  tryActivateConnector,
  tryDeactivateConnector,
} from '../connections'

export const Option = ({
  isActive,
  activeConnectionType,
  connectionType,
  onActivate,
  onDeactivate,
}: {
  isActive: boolean
  activeConnectionType: ConnectionType | null
  connectionType: ConnectionType
  onActivate: (connectionType: ConnectionType) => void
  onDeactivate: (connectionType: null) => void
}) => {
  const onClickActivate = async () => {
    const activation = await tryActivateConnector(
      getConnection(connectionType).connector
    )
    if (!activation) {
      return
    }
    onActivate(activation)
  }

  const onClickDeactivate = async () => {
    const deactivation = await tryDeactivateConnector(
      getConnection(connectionType).connector
    )
    if (!deactivation) {
      return
    }

    onDeactivate(deactivation)
  }

  return (
    <div>
      {((isActive &&
        (activeConnectionType === ConnectionType.NETWORK ||
          !activeConnectionType)) ||
        !isActive) && (
        <button
          onClick={() => {
            onClickActivate()
          }}>{`Connect ${connectionType}`}</button>
      )}
      {isActive && activeConnectionType === connectionType && (
        <button
          onClick={() => {
            onClickDeactivate()
          }}>
          {`Disconnect ${connectionType}`}
        </button>
      )}
    </div>
  )
}
