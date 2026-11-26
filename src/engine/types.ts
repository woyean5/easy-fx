export type Pair = 'USDJPY' | 'EURUSD' | 'AUDUSD' | 'GBPUSD'
export type Side = 'buy' | 'sell'

export interface Position {
  side: Side
  margin: number
  leverage: number
  entry: number
  units: number
}

export interface Account {
  balance: number
  position: Position | null
}
