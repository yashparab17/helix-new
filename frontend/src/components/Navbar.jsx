import { ConnectButton } from '@rainbow-me/rainbowkit'

export default function Navbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-helix-light to-helix-dark font-bold text-white">
            H
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-none text-white">Helix</h1>
            <p className="text-[11px] leading-none text-slate-400">
              Decentralized version control
            </p>
          </div>
        </div>
        <ConnectButton showBalance={false} chainStatus="icon" />
      </div>
    </header>
  )
}
