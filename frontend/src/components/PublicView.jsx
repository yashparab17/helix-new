import { useState } from 'react'
import { usePublicFiles, useCanUpload, useUploadFile } from '../hooks/useHelixContract.js'
import { shortCid } from '../utils/format.js'
import FileCard from './FileCard.jsx'
import UploadModal from './UploadModal.jsx'
import ActivityFeed from './ActivityFeed.jsx'

/**
 * History for a given address. Always readable without a wallet — that's
 * the point of the share link. If the connected wallet is the owner or one
 * of their collaborators, upload actions unlock too, so this same page
 * doubles as the "repository" a collaborator works from.
 */
export default function PublicView({ address }) {
  const { files, isLoading, error, refresh } = usePublicFiles(address)
  const canUpload = useCanUpload(address)
  const uploadFile = useUploadFile()
  const [copied, setCopied] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [prefillName, setPrefillName] = useState('')
  const [showActivity, setShowActivity] = useState(false)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      window.alert(`Could not copy automatically — link: ${window.location.href}`)
    }
  }

  const openUploadFor = (filename) => {
    setPrefillName(filename)
    setUploadOpen(true)
  }

  const openUploadNew = () => {
    setPrefillName('')
    setUploadOpen(true)
  }

  const handleUpload = async (filename, cid, onSubmitted) => {
    const hash = await uploadFile(address, filename, cid, onSubmitted)
    await refresh()
    return hash
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">
            {canUpload ? 'Shared file repository' : 'Public file history'}
          </h2>
          <p className="mt-1 font-mono text-sm text-slate-400" title={address}>
            {shortCid(address)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {canUpload
              ? "You're a collaborator on this repository — uploads you make here are recorded under this address."
              : "Read-only — anyone with this link can browse this address's version history. No wallet connection needed."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowActivity((v) => !v)}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-helix-light hover:text-helix-light"
          >
            {showActivity ? 'Hide activity' : 'Activity'}
          </button>
          <button
            onClick={handleCopyLink}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-helix-light hover:text-helix-light"
          >
            {copied ? 'Link copied!' : 'Copy link'}
          </button>
          {canUpload && (
            <button
              onClick={openUploadNew}
              className="rounded-lg bg-helix px-4 py-2 text-sm font-semibold text-white hover:bg-helix-light"
            >
              + Upload file
            </button>
          )}
        </div>
      </div>

      {showActivity && <ActivityFeed files={files} />}

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
          <FileCard
            key={file.filename}
            file={file}
            readOnly={!canUpload}
            onUploadNewVersion={openUploadFor}
            isArchived={false}
            onToggleArchive={() => {}}
          />
        ))}
      </div>

      {canUpload && (
        <UploadModal
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          onUpload={handleUpload}
          existingFilenames={files.map((f) => f.filename)}
          prefillName={prefillName}
          key={prefillName || 'new'}
        />
      )}
    </section>
  )
}
