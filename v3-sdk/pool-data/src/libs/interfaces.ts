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
  price0: string
  price1: string
  isCurrent: boolean
}

export interface BarChartTick {
  tickIdx: number
  liquidityActive: JSBI
  liquidityActiveNumber: number
  price0: string
  price1: string
  isCurrent: boolean
}
