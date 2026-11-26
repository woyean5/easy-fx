import { expect, test } from 'vitest'
import { stopOutMessage, lowerLeverage } from './stopOut'

test('stop-out message', () => {
  expect(stopOutMessage(30)).toBe('레버리지 30배에서는 3.3%만 반대로 움직여도 원금이 사라져요')
})
test('lowerLeverage steps down the ladder', () => {
  expect(lowerLeverage(30)).toBe(10)
  expect(lowerLeverage(10)).toBe(3)
  expect(lowerLeverage(1)).toBe(1)
})
