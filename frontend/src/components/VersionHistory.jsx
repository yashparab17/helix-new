import { useState } from 'react'
import { downloadFromIpfs, cidToGatewayUrl } from '../utils/pinata.js'

function formatTimestamp(unixSeconds) {
  return new Date(unixSeconds * 1000).toLocaleString()
}

function shortCid(cid) {
  if (!cid || cid.length <= 14) return cid
  return `${cid.slice(0, 8)}…${cid.slice(-6)}`
}

export default function VersionHistory({ filename, versions }) {
  const [downloadingVersion, setDownloadingVersion] = useState(null)

  // Show newest first for readability, but the underlying chain data (and
  // version numbers) are strictly linear / append-only oldest-to-newest.
  const ordered = [...versions].sort((a, b) => b.version - a.version)

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

  return (
    <ol className="relative ml-2 border-l border-slate-800 pl-4">
      {ordered.map((v, idx) => {
        const isLatest = idx === 0
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
                <p className="text-xs text-slate-500">{formatTimestamp(v.timestamp)}</p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
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
            </div>
          </li>
        )
      })}
    </ol>
  )
}
