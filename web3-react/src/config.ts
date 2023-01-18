// Sets if the example should run locally or on chain
export enum Chain {
  POLYGON,
  MAINNET,
}

// Inputs that configure this example to run
export interface ExampleConfig {
  chain: Chain
  rpc: {
    polygon: string
    mainnet: string
  }
}

// Example Configuration
export const CurrentConfig: ExampleConfig = {
  chain: Chain.MAINNET,
  rpc: {
    polygon: '',
    mainnet: '',
  },
}
