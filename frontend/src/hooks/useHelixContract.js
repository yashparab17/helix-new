import { useCallback, useEffect, useState } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { HELIX_ABI, HELIX_CONTRACT_ADDRESS } from '../config/contract.js'

/**
 * Centralizes all interaction with the Helix contract for the connected
 * wallet: loading the file list, loading per-file version history, and
 * appending new versions (uploads).
 */
export function useHelixContract() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const [files, setFiles] = useState([]) // [{ filename, versions: [...] }]
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadFiles = useCallback(async () => {
    if (!isConnected || !address || !publicClient) return
    setIsLoading(true)
    setError(null)
    try {
      const filenames = await publicClient.readContract({
        address: HELIX_CONTRACT_ADDRESS,
        abi: HELIX_ABI,
        functionName: 'getFiles',
        args: [address],
      })

      const withVersions = await Promise.all(
        filenames.map(async (filename) => {
          const versions = await publicClient.readContract({
            address: HELIX_CONTRACT_ADDRESS,
            abi: HELIX_ABI,
            functionName: 'getVersions',
            args: [address, filename],
          })
          // versions come back oldest-first from the contract; keep that
          // order for the linear history view, newest-last.
          return {
            filename,
            versions: versions.map((v) => ({
              cid: v.cid,
              version: Number(v.version),
              timestamp: Number(v.timestamp),
            })),
          }
        })
      )

      setFiles(withVersions)
    } catch (err) {
      console.error(err)
      setError(err.shortMessage || err.message || 'Failed to load files from chain.')
    } finally {
      setIsLoading(false)
    }
  }, [address, isConnected, publicClient])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  /**
   * Appends a new version for `filename` with the given `cid` by calling
   * the contract's uploadFile function, then refreshes local state.
   *
   * `onSubmitted(hash)`, if given, fires as soon as the wallet returns a
   * transaction hash — i.e. right after the user confirms in MetaMask, but
   * before the transaction is mined — so callers can show "submitted,
   * waiting for confirmation" instead of one opaque "confirming" spinner.
   */
  const appendVersion = useCallback(
    async (filename, cid, onSubmitted) => {
      if (!walletClient) throw new Error('Wallet not connected.')

      const hash = await walletClient.writeContract({
        address: HELIX_CONTRACT_ADDRESS,
        abi: HELIX_ABI,
        functionName: 'uploadFile',
        args: [filename, cid],
      })
      onSubmitted?.(hash)

      await publicClient.waitForTransactionReceipt({ hash })
      await loadFiles()
      return hash
    },
    [walletClient, publicClient, loadFiles]
  )

  return { files, isLoading, error, refresh: loadFiles, appendVersion }
}
