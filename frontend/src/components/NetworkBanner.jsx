import { useAccount, useSwitchChain } from 'wagmi'
import { anvilLocal } from '../config/wagmi.js'

/** Warns and offers a one-click switch when the connected wallet is on the wrong chain. */
export default function NetworkBanner() {
  const { isConnected, chainId } = useAccount()
  const { switchChain, isPending } = useSwitchChain()

  if (!isConnected || chainId === anvilLocal.id) return null

  return (
    <div className="border-b border-amber-900 bg-amber-950/60 px-4 py-2 text-center text-sm text-amber-300">
      Wrong network — Helix runs on {anvilLocal.name}.{' '}
      <button
        onClick={() => switchChain({ chainId: anvilLocal.id })}
        disabled={isPending}
        className="ml-1 underline hover:text-amber-100 disabled:opacity-50"
      >
        {isPending ? 'Switching…' : 'Switch network'}
      </button>
    </div>
  )
}
