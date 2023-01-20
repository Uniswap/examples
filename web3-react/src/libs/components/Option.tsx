import React from 'react'

import { ConnectionType, getConnection, tryActivateConnector, tryDeactivateConnector } from '../connections'

export const Option = ({
  isDisabled,
  isConnected,
  connectionType,
  onActivate,
  onDeactivate,
}: {
  isDisabled: boolean
  isConnected: boolean
  connectionType: ConnectionType
  onActivate: (connectionType: ConnectionType) => void
  onDeactivate: (connectionType: null) => void
}) => {
  const onClick = async () => {
    if (isConnected) {
      const deactivation = await tryDeactivateConnector(getConnection(connectionType).connector)
      if (deactivation === undefined) {
        return
      }
      onDeactivate(deactivation)
      return
    }

    const activation = await tryActivateConnector(getConnection(connectionType).connector)
    if (!activation) {
      return
    }
    onActivate(activation)
    return
  }

  return (
    <div>
      <button onClick={onClick} disabled={isDisabled}>{`${
        isConnected ? 'Disconnect' : 'Connect'
      } ${connectionType}`}</button>
    </div>
  )
}
