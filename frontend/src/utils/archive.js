import { useCallback, useEffect, useState } from 'react'
import { useAccount } from 'wagmi'

function storageKey(address) {
  return `helix-archived:${address ? address.toLowerCase() : 'anon'}`
}

/**
 * Client-side-only "hide from dashboard" list, per connected address.
 * Purely cosmetic: it never touches the contract, so archiving a file
 * does not affect its on-chain history and un-archiving brings it right back.
 */
export function useArchivedFilenames() {
  const { address } = useAccount()
  const [archived, setArchived] = useState(() => new Set())

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(address))
      setArchived(new Set(raw ? JSON.parse(raw) : []))
    } catch {
      setArchived(new Set())
    }
  }, [address])

  const toggleArchive = useCallback(
    (filename) => {
      setArchived((prev) => {
        const next = new Set(prev)
        if (next.has(filename)) next.delete(filename)
        else next.add(filename)
        try {
          localStorage.setItem(storageKey(address), JSON.stringify([...next]))
        } catch {
          // localStorage unavailable (private browsing, etc.) — archive state
          // just won't survive a reload; not worth surfacing an error for.
        }
        return next
      })
    },
    [address]
  )

  return { archived, toggleArchive }
}
