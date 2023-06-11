import JSBI from 'jsbi'

export interface GraphTick {
  tickIdx: string
  liquidityGross: string
  liquidityNet: string
}

export interface TickProcessed {
  tickIdx: number
  liquidityActive: JSBI
  liquidityNet: JSBI
  price0: number
  price1: number
  isCurrent: boolean
}

export interface BarChartTick {
  tickIdx: number
  liquidityActive: number
  liquidityLockedToken0: number
  liquidityLockedToken1: number
  price0: number
  price1: number
  isCurrent: boolean
}
