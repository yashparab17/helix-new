import { useState } from 'react'
import { isAddress } from 'viem'
import { useCollaborators } from '../hooks/useHelixContract.js'
import { shortCid } from '../utils/format.js'

/**
 * Lets the connected wallet manage who else can upload new versions to its
 * files. Purely additive — adding a collaborator never removes the owner's
 * own access, and only affects future uploads (past versions are untouched).
 */
export default function CollaboratorPanel() {
  const { collaborators, isLoading, error, add, remove } = useCollaborators()
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')

  const trimmed = input.trim()
  const isValid = trimmed.length > 0 && isAddress(trimmed)

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!isValid) return
    setBusy(true)
    setFormError('')
    try {
      await add(trimmed)
      setInput('')
    } catch (err) {
      console.error(err)
      setFormError(err.shortMessage || err.message || 'Failed to add collaborator.')
    } finally {
      setBusy(false)
    }
  }

  const handleRemove = async (collaborator) => {
    setBusy(true)
    setFormError('')
    try {
      await remove(collaborator)
    } catch (err) {
      console.error(err)
      setFormError(err.shortMessage || err.message || 'Failed to remove collaborator.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900 px-4 py-4">
      <h3 className="text-sm font-semibold text-white">Collaborators</h3>
      <p className="mt-1 text-xs text-slate-500">
        Addresses you add here can upload new versions to any of your files — same as you,
        minus the ability to manage this list.
      </p>

      <form onSubmit={handleAdd} className="mt-3 flex flex-wrap gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="0x… wallet address"
          disabled={busy}
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-helix-light focus:outline-none"
        />
        <button
          type="submit"
          disabled={!isValid || busy}
          className="rounded-lg bg-helix px-3 py-2 text-sm font-medium text-white hover:bg-helix-light disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add
        </button>
      </form>

      {(error || formError) && (
        <p className="mt-2 text-xs text-red-400">{formError || error}</p>
      )}

      {isLoading ? (
        <p className="mt-3 text-xs text-slate-500">Loading collaborators…</p>
      ) : collaborators.length === 0 ? (
        <p className="mt-3 text-xs text-slate-500">No collaborators yet — just you.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {collaborators.map((collaborator) => (
            <li
              key={collaborator}
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2"
            >
              <span className="font-mono text-xs text-slate-300" title={collaborator}>
                {shortCid(collaborator)}
              </span>
              <button
                onClick={() => handleRemove(collaborator)}
                disabled={busy}
                className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-red-500 hover:text-red-400 disabled:opacity-40"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
