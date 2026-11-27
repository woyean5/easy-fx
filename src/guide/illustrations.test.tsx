import { expect, test } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GuideCards } from './GuideCards'
import { GUIDE_CARDS } from './glossary'

test('every guide card shows an illustration with a description', () => {
  render(<GuideCards onClose={() => {}} />)
  for (let i = 0; i < GUIDE_CARDS.length; i++) {
    const img = screen.getByRole('img')
    expect(img.getAttribute('aria-label')!.length).toBeGreaterThan(5)
    if (i < GUIDE_CARDS.length - 1) fireEvent.click(screen.getByRole('button', { name: '다음' }))
  }
})
