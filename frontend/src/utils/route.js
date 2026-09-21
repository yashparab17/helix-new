const PUBLIC_VIEW_PATTERN = /^\/view\/(0x[a-fA-F0-9]{40})\/?$/

/** Extracts the address from a `/view/0x...` path, or null if it doesn't match. */
export function parsePublicViewAddress(pathname) {
  const match = pathname.match(PUBLIC_VIEW_PATTERN)
  return match ? match[1] : null
}

/** Builds the shareable public-view path for an address. */
export function publicViewPath(address) {
  return `/view/${address}`
}
