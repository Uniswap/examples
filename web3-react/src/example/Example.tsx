import './Example.css'

import { BigNumber } from '@ethersproject/bignumber'
import { useWeb3React } from '@web3-react/core'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { ErrorBoundary, FallbackProps } from 'react-error-boundary'

import { ConnectionOptions } from '../libs/components/ConnectionOptions'
import { ConnectionType } from '../libs/connections'
import { INPUT_CHAIN_URL } from '../libs/constants'

const FallbackComponent = ({ error }: FallbackProps) => {
  return (
    <div>
      <h1>An error occurred: {error.message}</h1>
      <p>Please reload the application</p>
    </div>
  )
}
// Listen for new blocks and update the wallet
const useOnBlockUpdated = (callback: (blockNumber: number) => void) => {
  const { provider } = useWeb3React()
  useEffect(() => {
    if (!provider) {
      return
    }
    const subscription = provider.on('block', callback)
    return () => {
      subscription.removeAllListeners()
    }
  })
}

// Parameters
const API_KEY = ''
const API_URL = 'https://beta.api.uniswap.org/v2/trade'
const headers = {
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
}
const forceGasless = false

// UI
const Example = () => {
  const { chainId, account, isActive, provider } = useWeb3React()
  const [blockNumber, setBlockNumber] = useState<number>(0)
  const [connectionType, setConnectionType] = useState<ConnectionType | null>(null)
  const [orders, setOrders] = useState<any[]>([])

  // Listen for new blocks and update the wallet
  useOnBlockUpdated(async (blockNumber: number) => {
    setBlockNumber(blockNumber)
    if (provider && provider.getSigner()) {
      const ordersResponse = await axios.get(`${API_URL}/orders`, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        params: {
          desc: true,
          sortKey: 'createdAt',
          swapper: await provider.getSigner().getAddress(),
          limit: 2,
        },
      })
      setOrders(ordersResponse.data.orders)
    }
  })

  const onPerformAction = async (tokenIn: string, tokenOut: string, amount: string) => {
    if (!provider) {
      console.error('Error: No provider')
      return
    }
    const signer = provider.getSigner()

    const approvalResponse = await axios.post(
      `${API_URL}/check_approval`,
      {
        walletAddress: await signer.getAddress(),
        amount: BigNumber.from(amount).mul(2).toString(),
        token: tokenIn,
        chainId: 1,
      },
      {
        headers,
      }
    )

    if (approvalResponse.data.approval) {
      await signer.sendTransaction(approvalResponse.data.approval)
    }

    const quoteResponse = await axios.post(
      `${API_URL}/quote`,
      {
        type: 'EXACT_INPUT',
        tokenInChainId: 1,
        tokenOutChainId: 1,
        tokenIn,
        tokenOut,
        amount,
        swapper: await signer.getAddress(),
        forceGasless,
      },
      {
        headers,
      }
    )

    const { quote, permitData, routing } = quoteResponse.data

    let signature
    if (permitData) {
      signature = await signer._signTypedData(permitData.domain, permitData.types, permitData.values)
    }

    let postOrderResponse
    if (routing === 'CLASSIC') {
      postOrderResponse = await axios.post(
        `${API_URL}/swap`,
        {
          signature,
          quote,
          permitData,
        },
        {
          headers,
        }
      )
      await signer.sendTransaction(postOrderResponse.data.swap)
    } else if (routing === 'DUTCH_LIMIT') {
      postOrderResponse = await axios.post(
        `${API_URL}/order`,
        {
          signature,
          quote,
        },
        {
          headers,
        }
      )
    }
  }

  const [tokenIn, setTokenIn] = useState('')
  const [tokenOut, setTokenOut] = useState('')
  const [amount, setAmount] = useState('')

  return (
    <div className="App">
      <ErrorBoundary FallbackComponent={FallbackComponent}>
        {INPUT_CHAIN_URL === '' && <h2 className="error">Please set your RPC URL in config.ts</h2>}
        <h3>{`Block Number: ${blockNumber + 1}`}</h3>
        <ConnectionOptions
          activeConnectionType={connectionType}
          isConnectionActive={isActive}
          onActivate={setConnectionType}
          onDeactivate={setConnectionType}
        />
        <p>{`ChainId: ${chainId}`}</p>
        <p>{`Connected Account: ${account}`}</p>
        <form>
          <label>
            Token in:
            <p />
            <input
              style={{ width: 400 }}
              type="text"
              value={tokenIn}
              onChange={(event) => setTokenIn(event.target.value)}
            />
          </label>
          <p />
          <label>
            Token out:
            <p />
            <input
              style={{ width: 400 }}
              type="text"
              value={tokenOut}
              onChange={(event) => setTokenOut(event.target.value)}
            />
          </label>
          <p />
          <label>
            Amount:
            <p />
            <input
              style={{ width: 400 }}
              type="text"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>
        </form>
        {/* {Object.keys(CHAIN_INFO).map((chainId) => (
          <div key={chainId}>
            <button onClick={() => switchNetwork(parseInt(chainId), connectionType)}>
              {`Switch to ${CHAIN_INFO[chainId].label}`}
            </button>
          </div>
        ))} */}
        <div>
          <button
            disabled={tokenIn === '0' || tokenOut === '0' || amount === '0'}
            onClick={() => {
              onPerformAction(tokenIn, tokenOut, amount)
            }}
          >
            Trade
          </button>
        </div>
        {orders.map((order) => (
          <div key={order.orderId}>
            <p>{`Order created at: ${order.createdAt}`}</p>
          </div>
        ))}
      </ErrorBoundary>
    </div>
  )
}

// eslint-disable-next-line import/no-default-export
export default Example
