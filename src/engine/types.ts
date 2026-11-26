export type Pair = 'USDJPY' | 'EURUSD' | 'AUDUSD' | 'GBPUSD' | 'USDKRW'
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
