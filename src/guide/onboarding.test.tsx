import { beforeEach, expect, test, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import * as s from '../storage/storage'
import { Onboarding } from './Onboarding'

beforeEach(() => { localStorage.clear(); s.__resetMemory() })

test('first launch flag', () => {
  expect(s.isOnboarded()).toBe(false)
  s.setOnboarded()
  expect(s.isOnboarded()).toBe(true)
})

test('four slides, then choose guide or start', () => {
  const done = vi.fn()
  render(<Onboarding onDone={done} />)
  expect(screen.getByText(/환영해요/)).toBeInTheDocument()
  for (let i = 0; i < 3; i++) fireEvent.click(screen.getByRole('button', { name: '다음' }))
  expect(screen.queryByRole('button', { name: '다음' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: /입문 가이드 보기/ }))
  expect(done).toHaveBeenCalledWith('guide')
  expect(s.isOnboarded()).toBe(true)
})

test('skip goes straight to the app', () => {
  const done = vi.fn()
  render(<Onboarding onDone={done} />)
  fireEvent.click(screen.getByRole('button', { name: '건너뛰기' }))
  expect(done).toHaveBeenCalledWith('start')
  expect(s.isOnboarded()).toBe(true)
})
