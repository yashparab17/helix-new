import { describe, it, expect } from 'vitest'
import { parsePublicViewAddress, publicViewPath } from './route.js'

describe('parsePublicViewAddress', () => {
  it('extracts the address from a valid /view/0x... path', () => {
    const addr = '0xdCC035c64564bf02cB2b52D8b80bB133acCf133B'
    expect(parsePublicViewAddress(`/view/${addr}`)).toBe(addr)
  })

  it('tolerates a trailing slash', () => {
    const addr = '0xdCC035c64564bf02cB2b52D8b80bB133acCf133B'
    expect(parsePublicViewAddress(`/view/${addr}/`)).toBe(addr)
  })

  it('returns null for the home path', () => {
    expect(parsePublicViewAddress('/')).toBeNull()
  })

  it('returns null for a malformed address', () => {
    expect(parsePublicViewAddress('/view/not-an-address')).toBeNull()
  })
})

describe('publicViewPath', () => {
  it('builds a /view/<address> path', () => {
    expect(publicViewPath('0xABC')).toBe('/view/0xABC')
  })
})
