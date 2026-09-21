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
          uploader: v.uploader,
        })),
      }
    })
  )
}

/**
 * Appends a new version to `owner`'s `filename`. Works whether the caller is
 * the owner themselves or a collaborator the owner has authorized — the
 * contract enforces that, this hook doesn't need to know which case it is.
 *
 * `onSubmitted(hash)`, if given, fires as soon as the wallet returns a
 * transaction hash — i.e. right after the user confirms in MetaMask, but
 * before the transaction is mined — so callers can show "submitted, waiting
 * for confirmation" instead of one opaque spinner.
 */
export function useUploadFile() {
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  return useCallback(
    async (owner, filename, cid, onSubmitted) => {
      if (!walletClient) throw new Error('Wallet not connected.')

      const hash = await walletClient.writeContract({
        address: HELIX_CONTRACT_ADDRESS,
        abi: HELIX_ABI,
        functionName: 'uploadFile',
        args: [owner, filename, cid],
      })
      onSubmitted?.(hash)

      await publicClient.waitForTransactionReceipt({ hash })
      return hash
    },
    [walletClient, publicClient]
  )
}

/**
 * Centralizes all interaction with the Helix contract for the connected
 * wallet's own dashboard: loading its file list/history and uploading new
 * versions to its own files.
 */
export function useHelixContract() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const uploadFile = useUploadFile()

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

  const appendVersion = useCallback(
    async (filename, cid, onSubmitted) => {
      const hash = await uploadFile(address, filename, cid, onSubmitted)
      await loadFiles()
      return hash
    },
    [uploadFile, address, loadFiles]
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

/**
 * Whether the connected wallet is allowed to upload on `owner`'s behalf —
 * true if it *is* owner, or if owner has added it as a collaborator. Used to
 * decide whether the public view unlocks upload actions for the visitor.
 */
export function useCanUpload(owner) {
  const { address: connected, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const [canUpload, setCanUpload] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function check() {
      if (!isConnected || !connected || !owner || !publicClient) {
        if (!cancelled) setCanUpload(false)
        return
      }
      if (connected.toLowerCase() === owner.toLowerCase()) {
        if (!cancelled) setCanUpload(true)
        return
      }
      try {
        const result = await publicClient.readContract({
          address: HELIX_CONTRACT_ADDRESS,
          abi: HELIX_ABI,
          functionName: 'isCollaborator',
          args: [owner, connected],
        })
        if (!cancelled) setCanUpload(result)
      } catch (err) {
        console.error(err)
        if (!cancelled) setCanUpload(false)
      }
    }

    check()
    return () => {
      cancelled = true
    }
  }, [connected, isConnected, owner, publicClient])

  return canUpload
}

/**
 * Manages the connected wallet's own collaborator list: who can currently
 * upload on its behalf, plus adding/removing them.
 */
export function useCollaborators() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const [collaborators, setCollaborators] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!isConnected || !address || !publicClient) return
    setIsLoading(true)
    setError(null)
    try {
      const list = await publicClient.readContract({
        address: HELIX_CONTRACT_ADDRESS,
        abi: HELIX_ABI,
        functionName: 'getCollaborators',
        args: [address],
      })
      setCollaborators(list)
    } catch (err) {
      console.error(err)
      setError(err.shortMessage || err.message || 'Failed to load collaborators.')
    } finally {
      setIsLoading(false)
    }
  }, [address, isConnected, publicClient])

  useEffect(() => {
    load()
  }, [load])

  const add = useCallback(
    async (collaborator) => {
      if (!walletClient) throw new Error('Wallet not connected.')
      const hash = await walletClient.writeContract({
        address: HELIX_CONTRACT_ADDRESS,
        abi: HELIX_ABI,
        functionName: 'addCollaborator',
        args: [collaborator],
      })
      await publicClient.waitForTransactionReceipt({ hash })
      await load()
      return hash
    },
    [walletClient, publicClient, load]
  )

  const remove = useCallback(
    async (collaborator) => {
      if (!walletClient) throw new Error('Wallet not connected.')
      const hash = await walletClient.writeContract({
        address: HELIX_CONTRACT_ADDRESS,
        abi: HELIX_ABI,
        functionName: 'removeCollaborator',
        args: [collaborator],
      })
      await publicClient.waitForTransactionReceipt({ hash })
      await load()
      return hash
    },
    [walletClient, publicClient, load]
  )

  return { collaborators, isLoading, error, add, remove, refresh: load }
}
