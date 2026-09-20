function csvEscape(value) {
  const str = String(value)
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

/** Serializes a flat list of {filename, version, cid, timestamp} rows as pretty JSON. */
export function buildJson(rows) {
  return JSON.stringify(rows, null, 2)
}

/** Serializes a flat list of {filename, version, cid, timestamp} rows as CSV. */
export function buildCsv(rows) {
  const header = 'filename,version,cid,timestamp,date'
  const lines = rows.map((r) =>
    [
      csvEscape(r.filename),
      r.version,
      csvEscape(r.cid),
      r.timestamp,
      csvEscape(new Date(r.timestamp * 1000).toISOString()),
    ].join(',')
  )
  return [header, ...lines].join('\n')
}

/** Triggers a browser download of `content` saved as `filename`. */
export function downloadText(content, filename, mime) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
