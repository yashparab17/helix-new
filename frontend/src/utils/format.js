/** Formats a unix-seconds timestamp as a locale date/time string. */
export function formatTimestamp(unixSeconds) {
  return new Date(unixSeconds * 1000).toLocaleString()
}

/** Truncates a CID to `abcdefgh…uvwxyz` for compact display. */
export function shortCid(cid) {
  if (!cid || cid.length <= 14) return cid
  return `${cid.slice(0, 8)}…${cid.slice(-6)}`
}

/** Formats a duration in seconds as the largest whole unit ("3d", "2h", "5m", "30s"). */
export function formatDuration(seconds) {
  if (seconds < 60) return `${Math.round(seconds)}s`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.round(hours / 24)
  return `${days}d`
}
