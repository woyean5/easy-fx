import { beforeEach, expect, test, vi } from 'vitest'
import * as s from './storage'

beforeEach(() => { localStorage.clear(); s.__resetMemory(); vi.restoreAllMocks() })

const rec = (returnPct: number) => ({ scenarioId: 'yen-crash-2022', leverage: 3, returnPct, stoppedOut: false, at: 1 })

test('bestReturn is the maximum for that scenario', () => {
  s.addRecord(rec(5)); s.addRecord(rec(-20)); s.addRecord(rec(12))
  expect(s.bestReturn('yen-crash-2022')).toBe(12)
  expect(s.bestReturn('brexit-2016')).toBeNull()
})

test('nickname is trimmed and limited to 1-12 chars', () => {
  s.setNickname('  민수  ')
  expect(s.getNickname()).toBe('민수')
  s.setNickname('1234567890123')
  expect(s.getNickname()).toBe('민수')
  s.setNickname('   ')
  expect(s.getNickname()).toBe('민수')
})

test('guide flag persists', () => {
  expect(s.isGuideDone()).toBe(false)
  s.setGuideDone()
  expect(s.isGuideDone()).toBe(true)
})

test('works when localStorage throws (private mode)', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied') })
  s.addRecord(rec(3))
  expect(s.getRecords()).toHaveLength(1)
})
