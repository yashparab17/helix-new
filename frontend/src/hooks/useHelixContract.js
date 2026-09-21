import { useCallback, useEffect, useState } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { HELIX_ABI, HELIX_CONTRACT_ADDRESS } from '../config/contract.js'

/**
 * Reads every file (and its full version history) that `owner` has ever
 * uploaded, straight from the contract's public view functions. Shared by
 * the connected-wallet dashboard and the public read-only view — both just
 * need "all files for this address," the only difference is where the
 * address comes from.
 */
async function fetchFilesForOwner(publicClient, owner) {
  const filenames = await publicClient.readContract({
    address: HELIX_CONTRACT_ADDRESS,
    abi: HELIX_ABI,
    functionName: 'getFiles',
    args: [owner],
  })

  return Promise.all(
    filenames.map(async (filename) => {
      const versions = await publicClient.readContract({
        address: HELIX_CONTRACT_ADDRESS,
        abi: HELIX_ABI,
        functionName: 'getVersions',
        args: [owner, filename],
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
}

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
      setFiles(await fetchFilesForOwner(publicClient, address))
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

/**
 * Read-only counterpart to useHelixContract: loads `owner`'s file history
 * without requiring a connected wallet at all — just an address and the
 * chain's public RPC. Powers the public share-link view.
 */
export function usePublicFiles(owner) {
  const publicClient = usePublicClient()

  const [files, setFiles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadFiles = useCallback(async () => {
    if (!publicClient || !owner) return
    setIsLoading(true)
    setError(null)
    try {
      setFiles(await fetchFilesForOwner(publicClient, owner))
    } catch (err) {
      console.error(err)
      setError(err.shortMessage || err.message || 'Failed to load files from chain.')
    } finally {
      setIsLoading(false)
    }
  }, [publicClient, owner])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  return { files, isLoading, error, refresh: loadFiles }
}
