import { useState } from 'react'
import { uploadToPinata } from '../utils/pinata.js'

const STAGES = {
  IDLE: 'idle',
  PINNING: 'pinning',
  CONFIRMING: 'confirming',
  DONE: 'done',
  ERROR: 'error',
}

export default function UploadModal({ open, onClose, onUpload, existingFilenames, prefillName = '' }) {
  const [file, setFile] = useState(null)
  const [customName, setCustomName] = useState(prefillName)
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState(STAGES.IDLE)
  const [errorMsg, setErrorMsg] = useState('')

  if (!open) return null

  const effectiveName = customName.trim() || file?.name || ''
  const isNewVersion = existingFilenames.includes(effectiveName)

  const reset = () => {
    setFile(null)
    setCustomName(prefillName)
    setProgress(0)
    setStage(STAGES.IDLE)
    setErrorMsg('')
  }

  const handleClose = () => {
    if (stage === STAGES.PINNING || stage === STAGES.CONFIRMING) return
    reset()
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file || !effectiveName) return

    try {
      setStage(STAGES.PINNING)
      setErrorMsg('')
      const cid = await uploadToPinata(file, setProgress)

      setStage(STAGES.CONFIRMING)
      await onUpload(effectiveName, cid)

      setStage(STAGES.DONE)
      setTimeout(() => {
        reset()
        onClose()
      }, 1200)
    } catch (err) {
      console.error(err)
      setStage(STAGES.ERROR)
      setErrorMsg(err.shortMessage || err.message || 'Upload failed.')
    }
  }

  const busy = stage === STAGES.PINNING || stage === STAGES.CONFIRMING

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Upload file</h2>
          <button
            onClick={handleClose}
            disabled={busy}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-40"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Choose a file
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              disabled={busy}
              className="block w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-300 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-helix file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-helix-light"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Tracked filename
            </label>
            <input
              type="text"
              placeholder={file?.name || 'e.g. spec.pdf'}
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              disabled={busy}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-helix-light focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-500">
              {effectiveName
                ? isNewVersion
                  ? `This will be recorded as a new version of "${effectiveName}".`
                  : `This will create a new tracked file called "${effectiveName}".`
                : 'Uses the original filename unless you override it.'}
            </p>
          </div>

          {stage === STAGES.PINNING && (
            <div>
              <div className="mb-1 flex justify-between text-xs text-slate-400">
                <span>Pinning to IPFS via Pinata…</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-helix transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {stage === STAGES.CONFIRMING && (
            <p className="text-sm text-amber-400">
              Confirm the transaction in MetaMask to record this version on-chain…
            </p>
          )}

          {stage === STAGES.DONE && (
            <p className="text-sm text-emerald-400">Version recorded on-chain ✓</p>
          )}

          {stage === STAGES.ERROR && (
            <p className="break-words text-sm text-red-400">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={!file || !effectiveName || busy}
            className="w-full rounded-lg bg-helix px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-helix-light disabled:cursor-not-allowed disabled:opacity-40"
          >
            {stage === STAGES.PINNING
              ? 'Uploading to IPFS…'
              : stage === STAGES.CONFIRMING
              ? 'Waiting for confirmation…'
              : 'Upload & record on-chain'}
          </button>
        </form>
      </div>
    </div>
  )
}
