import React from 'react'

import { ConnectionType, getConnection, tryActivateConnector, tryDeactivateConnector } from '../connections'

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
  const isOptionActive = isActive && activeConnectionType === connectionType
  const isOtherOptionActive =
    isActive && activeConnectionType !== connectionType && activeConnectionType !== ConnectionType.NETWORK

  const onClick = async () => {
    if (isOptionActive) {
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
      <button onClick={onClick} disabled={isOtherOptionActive}>{`${
        isOptionActive ? 'Disconnect' : 'Connect'
      } ${connectionType}`}</button>
    </div>
  )
}
