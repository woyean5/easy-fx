import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GLOSSARY } from './glossary'
import { LeveragePicker } from '../components/LeveragePicker'

test('every glossary title is "한국어 (English)"', () => {
  for (const g of Object.values(GLOSSARY)) expect(g.title).toMatch(/^.+ \(.+\)$/)
})

test('10x and 30x are locked before the guide is done', () => {
  render(<LeveragePicker guideDone={false} onPick={() => {}} onOpenGuide={() => {}} onCancel={() => {}} />)
  expect(screen.getByRole('button', { name: /10배/ })).toHaveAttribute('aria-disabled', 'true')
  expect(screen.getByRole('button', { name: /30배/ })).toHaveAttribute('aria-disabled', 'true')
  expect(screen.getByRole('button', { name: /^3배/ })).toHaveAttribute('aria-disabled', 'false')
})

test('all leverages are open after the guide', () => {
  render(<LeveragePicker guideDone onPick={() => {}} onOpenGuide={() => {}} onCancel={() => {}} />)
  expect(screen.getByRole('button', { name: /30배/ })).toHaveAttribute('aria-disabled', 'false')
})
