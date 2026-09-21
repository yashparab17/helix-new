import { describe, it, expect } from 'vitest'
import { getPreviewKind } from './preview.js'

describe('getPreviewKind', () => {
  it('classifies common image extensions', () => {
    expect(getPreviewKind('photo.png')).toBe('image')
    expect(getPreviewKind('photo.JPG')).toBe('image')
    expect(getPreviewKind('icon.svg')).toBe('image')
  })

  it('classifies pdf', () => {
    expect(getPreviewKind('report.pdf')).toBe('pdf')
    expect(getPreviewKind('report.PDF')).toBe('pdf')
  })

  it('classifies common text-like extensions', () => {
    expect(getPreviewKind('notes.txt')).toBe('text')
    expect(getPreviewKind('README.md')).toBe('text')
    expect(getPreviewKind('data.json')).toBe('text')
    expect(getPreviewKind('config.yaml')).toBe('text')
  })

  it('returns null for unrecognized extensions', () => {
    expect(getPreviewKind('archive.zip')).toBeNull()
    expect(getPreviewKind('video.mp4')).toBeNull()
    expect(getPreviewKind('noextension')).toBeNull()
  })
})
