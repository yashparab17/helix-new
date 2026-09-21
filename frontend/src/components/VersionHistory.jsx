import { useEffect, useState } from 'react'
import { downloadFromIpfs, cidToGatewayUrl } from '../utils/pinata.js'
import { formatTimestamp, formatDuration, shortCid } from '../utils/format.js'
import { getPreviewKind } from '../utils/preview.js'

// ponytail: truncates fetched text previews to keep the DOM light; full file
// is still what gets downloaded/viewed via the other buttons. Raise this (or
// add pagination) if previewing multi-MB text files becomes a real need.
const TEXT_PREVIEW_CHAR_LIMIT = 5000

export default function VersionHistory({ filename, versions }) {
  const [downloadingVersion, setDownloadingVersion] = useState(null)
  const [copiedVersion, setCopiedVersion] = useState(null)
  const [previewVersion, setPreviewVersion] = useState(null)
  const [textPreviews, setTextPreviews] = useState({}) // version -> { status, content|message }

  // Show newest first for readability, but the underlying chain data (and
  // version numbers) are strictly linear / append-only oldest-to-newest.
  const ordered = [...versions].sort((a, b) => b.version - a.version)
  const previewKind = getPreviewKind(filename)

  useEffect(() => {
    if (previewKind !== 'text' || previewVersion == null) return
    if (textPreviews[previewVersion]) return
    const version = ordered.find((v) => v.version === previewVersion)
    if (!version) return

    setTextPreviews((prev) => ({ ...prev, [previewVersion]: { status: 'loading' } }))
    fetch(cidToGatewayUrl(version.cid))
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch preview (status ${res.status})`)
        return res.text()
      })
      .then((text) => {
        setTextPreviews((prev) => ({
          ...prev,
          [previewVersion]: { status: 'done', content: text.slice(0, TEXT_PREVIEW_CHAR_LIMIT) },
        }))
      })
      .catch((err) => {
        setTextPreviews((prev) => ({
          ...prev,
          [previewVersion]: { status: 'error', message: err.message || 'Preview failed.' },
        }))
      })
  }, [previewKind, previewVersion, ordered, textPreviews])

  const handleDownload = async (version) => {
    try {
      setDownloadingVersion(version.version)
      await downloadFromIpfs(version.cid, `${filename}`)
    } catch (err) {
      console.error(err)
      window.alert(err.message || 'Download failed.')
    } finally {
      setDownloadingVersion(null)
    }
  }

  const handleCopy = async (version) => {
    try {
      await navigator.clipboard.writeText(version.cid)
      setCopiedVersion(version.version)
      setTimeout(() => setCopiedVersion(null), 1500)
    } catch {
      window.alert(`Could not copy automatically — CID: ${version.cid}`)
    }
  }

  return (
    <ol className="relative ml-2 border-l border-slate-800 pl-4">
      {ordered.map((v, idx) => {
        const isLatest = idx === 0
        const prev = ordered[idx + 1]
        const secondsSincePrev = prev ? v.timestamp - prev.timestamp : null
        return (
          <li key={v.version} className="mb-4 last:mb-0">
            <span
              className={`absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full ${
                isLatest ? 'bg-helix-light' : 'bg-slate-600'
              }`}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                      isLatest
                        ? 'bg-helix/20 text-helix-light'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    v{v.version}
                  </span>
                  {isLatest && (
                    <span className="text-xs font-medium text-emerald-400">current</span>
                  )}
                </div>
                <p className="mt-1 truncate font-mono text-xs text-slate-400" title={v.cid}>
                  {shortCid(v.cid)}
                </p>
                <p className="text-xs text-slate-500">
                  {formatTimestamp(v.timestamp)}
                  {secondsSincePrev != null && (
                    <span className="text-slate-600"> · {formatDuration(secondsSincePrev)} after v{prev.version}</span>
                  )}
                </p>
                {v.uploader && (
                  <p className="mt-0.5 truncate text-xs text-slate-600" title={v.uploader}>
                    by <span className="font-mono">{shortCid(v.uploader)}</span>
                  </p>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button
                  onClick={() => handleCopy(v)}
                  className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-helix-light hover:text-helix-light"
                >
                  {copiedVersion === v.version ? 'Copied!' : 'Copy CID'}
                </button>
                {previewKind && (
                  <button
                    onClick={() => setPreviewVersion(previewVersion === v.version ? null : v.version)}
                    className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-helix-light hover:text-helix-light"
                  >
                    {previewVersion === v.version ? 'Hide' : 'Preview'}
                  </button>
                )}
                <a
                  href={cidToGatewayUrl(v.cid)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-helix-light hover:text-helix-light"
                >
                  View
                </a>
                <button
                  onClick={() => handleDownload(v)}
                  disabled={downloadingVersion === v.version}
                  className="rounded-md bg-helix px-2 py-1 text-xs font-medium text-white hover:bg-helix-light disabled:opacity-50"
                >
                  {downloadingVersion === v.version ? 'Downloading…' : 'Download'}
                </button>
              </div>

              {previewVersion === v.version && previewKind === 'image' && (
                <img
                  src={cidToGatewayUrl(v.cid)}
                  alt={`${filename} v${v.version} preview`}
                  className="mt-2 max-h-64 w-full rounded-lg border border-slate-800 object-contain"
                />
              )}

              {previewVersion === v.version && previewKind === 'pdf' && (
                <iframe
                  src={cidToGatewayUrl(v.cid)}
                  title={`${filename} v${v.version} preview`}
                  className="mt-2 h-96 w-full rounded-lg border border-slate-800"
                />
              )}

              {previewVersion === v.version && previewKind === 'text' && (
                <div className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  {textPreviews[v.version]?.status === 'loading' && (
                    <p className="text-xs text-slate-500">Loading preview…</p>
                  )}
                  {textPreviews[v.version]?.status === 'error' && (
                    <p className="text-xs text-red-400">{textPreviews[v.version].message}</p>
                  )}
                  {textPreviews[v.version]?.status === 'done' && (
                    <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-slate-300">
                      {textPreviews[v.version].content}
                      {textPreviews[v.version].content.length >= TEXT_PREVIEW_CHAR_LIMIT && (
                        <span className="text-slate-600">{'\n… truncated, download for the full file'}</span>
                      )}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
