import { useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import FileCard from './FileCard.jsx'
import { useArchivedFilenames } from '../utils/archive.js'
import { buildCsv, buildJson, downloadText } from '../utils/exportHistory.js'
import { publicViewPath } from '../utils/route.js'

export default function Dashboard({ files, isLoading, error, onNewUpload, onUploadNewVersion }) {
  const { address } = useAccount()
  const [query, setQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const { archived, toggleArchive } = useArchivedFilenames()

  const archivedCount = files.filter((f) => archived.has(f.filename)).length

  const visibleFiles = useMemo(() => {
    return files.filter((f) => {
      if (!showArchived && archived.has(f.filename)) return false
      if (query && !f.filename.toLowerCase().includes(query.trim().toLowerCase())) return false
      return true
    })
  }, [files, archived, showArchived, query])

  const handleExport = (format) => {
    const rows = files.flatMap((f) => f.versions.map((v) => ({ filename: f.filename, ...v })))
    if (rows.length === 0) return
    if (format === 'csv') downloadText(buildCsv(rows), 'helix-history.csv', 'text/csv')
    else downloadText(buildJson(rows), 'helix-history.json', 'application/json')
  }

  const handleCopyShareLink = async () => {
    const url = `${window.location.origin}${publicViewPath(address)}`
    try {
      await navigator.clipboard.writeText(url)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 1500)
    } catch {
      window.alert(`Could not copy automatically — link: ${url}`)
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">Your files</h2>
          <p className="text-sm text-slate-400">
            Every file is content-addressed on IPFS and versioned on-chain.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyShareLink}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-helix-light hover:text-helix-light"
          >
            {linkCopied ? 'Link copied!' : 'Share'}
          </button>
          <button
            onClick={() => handleExport('json')}
            disabled={files.length === 0}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-helix-light hover:text-helix-light disabled:opacity-40"
          >
            Export JSON
          </button>
          <button
            onClick={() => handleExport('csv')}
            disabled={files.length === 0}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-helix-light hover:text-helix-light disabled:opacity-40"
          >
            Export CSV
          </button>
          <button
            onClick={onNewUpload}
            className="rounded-lg bg-helix px-4 py-2 text-sm font-semibold text-white hover:bg-helix-light"
          >
            + Upload file
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search files by name…"
          className="w-full max-w-xs rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-helix-light focus:outline-none"
        />
        {archivedCount > 0 && (
          <label className="flex items-center gap-2 text-sm text-slate-400">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded border-slate-700 bg-slate-800"
            />
            Show archived ({archivedCount})
          </label>
        )}
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
          <p className="text-slate-400">No files yet.</p>
          <p className="mt-1 text-sm text-slate-500">
            Upload your first file to start a version history.
          </p>
        </div>
      )}

      {!isLoading && files.length > 0 && visibleFiles.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-800 px-4 py-12 text-center">
          <p className="text-slate-400">No files match your filters.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {visibleFiles.map((file) => (
          <FileCard
            key={file.filename}
            file={file}
            onUploadNewVersion={onUploadNewVersion}
            isArchived={archived.has(file.filename)}
            onToggleArchive={toggleArchive}
          />
        ))}
      </div>
    </section>
  )
}
