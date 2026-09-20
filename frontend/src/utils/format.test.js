import { describe, it, expect } from 'vitest'
import { formatDuration, shortCid } from './format.js'

describe('formatDuration', () => {
  it('formats sub-minute durations as seconds', () => {
    expect(formatDuration(30)).toBe('30s')
  })

  it('formats sub-hour durations as minutes', () => {
    expect(formatDuration(90)).toBe('2m')
  })

  it('formats sub-day durations as hours', () => {
    expect(formatDuration(3700)).toBe('1h')
  })

  it('formats multi-day durations as days', () => {
    expect(formatDuration(90000)).toBe('1d')
  })
})

describe('shortCid', () => {
  it('leaves short CIDs untouched', () => {
    expect(shortCid('QmShort')).toBe('QmShort')
  })

  it('truncates long CIDs to head…tail', () => {
    expect(shortCid('QmVeryLongCidValueHere1234567890')).toBe('QmVeryLo…567890')
  })

  it('passes through empty/falsy input', () => {
    expect(shortCid('')).toBe('')
  })
})
