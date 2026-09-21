import { useState } from 'react'
import { usePublicFiles } from '../hooks/useHelixContract.js'
import { shortCid } from '../utils/format.js'
import FileCard from './FileCard.jsx'

/**
 * Read-only history for a given address — no wallet connection required.
 * This is the page a Helix user shares so collaborators can browse their
 * files/versions without needing to hold or import that wallet's key.
 */
export default function PublicView({ address }) {
  const { files, isLoading, error } = usePublicFiles(address)
  const [copied, setCopied] = useState(false)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      window.alert(`Could not copy automatically — link: ${window.location.href}`)
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">Public file history</h2>
          <p className="mt-1 font-mono text-sm text-slate-400" title={address}>
            {shortCid(address)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Read-only — anyone with this link can browse this address's version history. No
            wallet connection needed.
          </p>
        </div>
        <button
          onClick={handleCopyLink}
          className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-helix-light hover:text-helix-light"
        >
          {copied ? 'Link copied!' : 'Copy link'}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-8 text-center text-slate-400">
          Loading files from chain…
        </div>
      )}

      {!isLoading && files.length === 0 && !error && (
        <div className="rounded-xl border border-dashed border-slate-800 px-4 py-12 text-center">
          <p className="text-slate-400">This address hasn't uploaded any files yet.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {files.map((file) => (
          <FileCard key={file.filename} file={file} readOnly />
        ))}
      </div>
    </section>
  )
}
