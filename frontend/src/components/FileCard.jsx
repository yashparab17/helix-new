import { useState } from 'react'
import VersionHistory from './VersionHistory.jsx'

export default function FileCard({ file, onUploadNewVersion, isArchived, onToggleArchive }) {
  const [expanded, setExpanded] = useState(false)
  const latest = [...file.versions].sort((a, b) => b.version - a.version)[0]

  return (
    <div className={`rounded-xl border bg-slate-900 shadow-sm ${isArchived ? 'border-slate-800/50 opacity-60' : 'border-slate-800'}`}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-helix-light">
            📄
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-white">{file.filename}</p>
            <p className="truncate text-xs text-slate-500">
              {file.versions.length} version{file.versions.length !== 1 ? 's' : ''} · latest{' '}
              <span className="font-mono">v{latest?.version}</span>
              {isArchived && <span className="ml-1 text-amber-500">· archived</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            onClick={(e) => {
              e.stopPropagation()
              onUploadNewVersion(file.filename)
            }}
            role="button"
            className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-helix-light hover:text-helix-light"
          >
            + New version
          </span>
          <span
            onClick={(e) => {
              e.stopPropagation()
              onToggleArchive(file.filename)
            }}
            role="button"
            className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-amber-400 hover:text-amber-300"
          >
            {isArchived ? 'Unarchive' : 'Archive'}
          </span>
          <span className={`text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-800 px-4 py-4">
          <VersionHistory filename={file.filename} versions={file.versions} />
        </div>
      )}
    </div>
  )
}
