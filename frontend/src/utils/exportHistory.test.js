import { describe, it, expect } from 'vitest'
import { buildCsv, buildJson } from './exportHistory.js'

const rows = [
  { filename: 'report.pdf', version: 1, cid: 'QmCid1', timestamp: 1700000000 },
  { filename: 'a,tricky "name".txt', version: 1, cid: 'QmCid2', timestamp: 1700000100 },
]

describe('buildJson', () => {
  it('round-trips the rows as pretty JSON', () => {
    expect(JSON.parse(buildJson(rows))).toEqual(rows)
  })
})

describe('buildCsv', () => {
  it('starts with a header row', () => {
    expect(buildCsv(rows).split('\n')[0]).toBe('filename,version,cid,timestamp,date')
  })

  it('emits one data row per version', () => {
    const lines = buildCsv(rows).split('\n')
    expect(lines).toHaveLength(rows.length + 1)
  })

  it('quotes and escapes filenames containing commas or quotes', () => {
    const csv = buildCsv(rows)
    expect(csv).toContain('"a,tricky ""name"".txt"')
  })
})
