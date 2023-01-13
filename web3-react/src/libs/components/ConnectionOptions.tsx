import { Connector } from '@web3-react/types'
import React from 'react'
import {
  getHasMetaMaskExtensionInstalled,
  ConnectionType,
} from '../connections'
import { METAMASK_URL } from '../constants'
import { MetaMaskOption } from './MetaMaskOption'
import { CoinbaseOption } from './CoinbaseOption'
import { WalletConnectOption } from './WalletConnectOption'

type ConnectOptionsParams = {
  connectionType: ConnectionType | null
  isActive: boolean
  onActivate: (connector: Connector) => Promise<void>
  onDeactivate: (connector: Connector) => Promise<void>
}

export const ConnectionOptions = ({
  connectionType,
  isActive,
  onActivate,
  onDeactivate,
}: ConnectOptionsParams) => {
  function getOptions(isActive: boolean) {
    const hasMetaMaskExtension = getHasMetaMaskExtensionInstalled()

    let meteMaskOption
    if (!hasMetaMaskExtension) {
      meteMaskOption = (
        <a href={METAMASK_URL}>
          <button>Install Metamask</button>
        </a>
      )
    } else {
      meteMaskOption = (
        <MetaMaskOption
          isActive={isActive}
          connectionType={connectionType}
          onActivate={onActivate}
          onDeactivate={onDeactivate}
        />
      )
    }

    const coinbaseWalletOption = (
      <CoinbaseOption
        isActive={isActive}
        connectionType={connectionType}
        onActivate={onActivate}
        onDeactivate={onDeactivate}
      />
    )

    const walletConnectOption = (
      <WalletConnectOption
        isActive={isActive}
        connectionType={connectionType}
        onActivate={onActivate}
        onDeactivate={onDeactivate}
      />
    )

    return (
      <>
        {meteMaskOption}
        {coinbaseWalletOption}
        {walletConnectOption}
      </>
    )
  }

  return <div className="connectors">{getOptions(isActive)}</div>
}
