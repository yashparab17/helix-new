import { cidToGatewayUrl } from '../utils/pinata.js'
import { formatTimestamp, shortCid } from '../utils/format.js'

// ponytail: caps the feed at the 25 most recent events instead of paginating.
// Fine for a demo-scale repository; add pagination/infinite scroll if a real
// repo's event count ever makes this feel cramped.
const MAX_EVENTS = 25

/**
 * Every version, across every file, newest first — a single place to see
 * "what changed and who touched it," instead of opening each file card.
 * Most useful once a repository has collaborators.
 */
export default function ActivityFeed({ files }) {
  const events = files
    .flatMap((f) => f.versions.map((v) => ({ ...v, filename: f.filename })))
    .sort((a, b) => b.timestamp - a.timestamp)

  return (
    <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900 px-4 py-4">
      <h3 className="text-sm font-semibold text-white">Recent activity</h3>

      {events.length === 0 ? (
        <p className="mt-3 text-xs text-slate-500">No activity yet.</p>
      ) : (
        <>
          <ul className="mt-3 space-y-2">
            {events.slice(0, MAX_EVENTS).map((e, i) => (
              <li
                key={`${e.filename}-${e.version}-${i}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs text-slate-200">
                    <span className="font-medium">{e.filename}</span>{' '}
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-400">
                      v{e.version}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatTimestamp(e.timestamp)}
                    {e.uploader && (
                      <>
                        {' '}
                        · by <span className="font-mono">{shortCid(e.uploader)}</span>
                      </>
                    )}
                  </p>
                </div>
                <a
                  href={cidToGatewayUrl(e.cid)}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-helix-light hover:text-helix-light"
                >
                  View
                </a>
              </li>
            ))}
          </ul>
          {events.length > MAX_EVENTS && (
            <p className="mt-2 text-xs text-slate-600">
              Showing the {MAX_EVENTS} most recent of {events.length} events.
            </p>
          )}
        </>
      )}
    </div>
  )
}
