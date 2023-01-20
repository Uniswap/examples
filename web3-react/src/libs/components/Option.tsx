import React, { useCallback, useMemo } from 'react'

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
  const isOptionActive = useMemo(
    () => isActive && activeConnectionType === connectionType,
    [isActive, activeConnectionType, connectionType]
  )

  const isOtherOptionActive = useMemo(
    () => isActive && activeConnectionType !== connectionType && activeConnectionType !== ConnectionType.NETWORK,
    [isActive, activeConnectionType, connectionType]
  )

  const onClick = useCallback(async () => {
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
  }, [isOptionActive, connectionType, onActivate, onDeactivate])

  return (
    <div>
      <button onClick={onClick} disabled={isOtherOptionActive}>{`${
        isOptionActive ? 'Disconnect' : 'Connect'
      } ${connectionType}`}</button>
    </div>
  )
}
