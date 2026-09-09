import axios from 'axios'

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT
const PINATA_PIN_FILE_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS'
const IPFS_GATEWAY =
  import.meta.env.VITE_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs'

/**
 * Uploads a File/Blob to IPFS via the Pinata REST API and returns the CID.
 * @param {File} file - the file selected by the user
 * @param {(percent: number) => void} [onProgress] - optional upload progress callback
 * @returns {Promise<string>} the IPFS CID (IpfsHash) returned by Pinata
 */
export async function uploadToPinata(file, onProgress) {
  if (!PINATA_JWT) {
    throw new Error(
      'Missing VITE_PINATA_JWT. Add your Pinata JWT to frontend/.env — see USAGE.md.'
    )
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append(
    'pinataMetadata',
    JSON.stringify({ name: file.name })
  )
  formData.append(
    'pinataOptions',
    JSON.stringify({ cidVersion: 1 })
  )

  const response = await axios.post(PINATA_PIN_FILE_URL, formData, {
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded * 100) / evt.total))
      }
    },
  })

  return response.data.IpfsHash
}

/** Builds a fetchable gateway URL for a given CID. */
export function cidToGatewayUrl(cid) {
  return `${IPFS_GATEWAY}/${cid}`
}

/** Triggers a browser download of the file at `cid`, saved as `filename`. */
export async function downloadFromIpfs(cid, filename) {
  const url = cidToGatewayUrl(cid)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${filename} from IPFS (status ${response.status})`)
  }
  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}
