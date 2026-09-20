import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('axios')

describe('pinata utils', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  it('throws a clear error when no Pinata JWT is configured', async () => {
    vi.stubEnv('VITE_PINATA_JWT', '')
    const { uploadToPinata } = await import('./pinata.js')

    await expect(uploadToPinata(new File(['x'], 'a.txt'))).rejects.toThrow(/VITE_PINATA_JWT/)
  })

  it('uploads the file and returns the CID Pinata assigns', async () => {
    vi.stubEnv('VITE_PINATA_JWT', 'test-jwt')
    const axios = (await import('axios')).default
    axios.post.mockResolvedValue({ data: { IpfsHash: 'QmTest123' } })

    const { uploadToPinata } = await import('./pinata.js')
    const cid = await uploadToPinata(new File(['x'], 'a.txt'))

    expect(cid).toBe('QmTest123')
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('pinFileToIPFS'),
      expect.anything(),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-jwt' }),
      })
    )
  })

  it('builds a gateway URL from a CID', async () => {
    vi.stubEnv('VITE_IPFS_GATEWAY', 'https://gw.test/ipfs')
    const { cidToGatewayUrl } = await import('./pinata.js')

    expect(cidToGatewayUrl('QmXYZ')).toBe('https://gw.test/ipfs/QmXYZ')
  })
})
