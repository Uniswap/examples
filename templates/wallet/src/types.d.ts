import { Currency } from '@uniswap/sdk-core'

export interface Environment {
  currencyIn: Currency
  currencyOut: Currency
  currencyInAmount: string | number
  currencyOutAmount?: string | number
  mainnetRpcUrl: string
}
