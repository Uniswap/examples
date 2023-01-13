// Sets if the example should run locally or on chain
export enum Environment {
  LOCAL,
  MAINNET,
}

// Inputs that configure this example to run
export interface ExampleConfig {
  env: Environment
  rpc: {
    local: string
    mainnet: string
  }
}

// Example Configuration

export const CurrentConfig: ExampleConfig = {
  env: Environment.LOCAL,
  rpc: {
    local: 'http://localhost:8545',
    mainnet: 'https://mainnet.gateway.tenderly.co/biusNZqSR6tj1wxGGykHD',
  },
}
