import { useState } from 'react'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'

import Navbar from './components/Navbar.jsx'
import Dashboard from './components/Dashboard.jsx'
import UploadModal from './components/UploadModal.jsx'
import { useHelixContract } from './hooks/useHelixContract.js'

export default function App() {
  const { isConnected } = useAccount()
  const { files, isLoading, error, appendVersion } = useHelixContract()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [prefillName, setPrefillName] = useState('')

  const openUploadFor = (filename) => {
    setPrefillName(filename)
    setUploadOpen(true)
  }

  const openUploadNew = () => {
    setPrefillName('')
    setUploadOpen(true)
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      {!isConnected ? (
        <main className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-helix-light to-helix-dark text-2xl font-bold text-white">
            H
          </div>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Decentralized, blockchain-powered version control
          </h1>
          <p className="mt-3 max-w-lg text-slate-400">
            Connect your MetaMask wallet to make your address your identity. Upload files to
            IPFS, record every version on-chain, and pull any past version back down whenever
            you need it.
          </p>
          <div className="mt-8">
            <ConnectButton />
          </div>
        </main>
      ) : (
        <main>
          <Dashboard
            files={files}
            isLoading={isLoading}
            error={error}
            onNewUpload={openUploadNew}
            onUploadNewVersion={openUploadFor}
          />
        </main>
      )}

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={appendVersion}
        existingFilenames={files.map((f) => f.filename)}
        prefillName={prefillName}
        key={prefillName || 'new'}
      />

      <footer className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-slate-600 sm:px-6">
        Helix — files live on IPFS, version history lives on-chain, nothing lives on our
        servers.
      </footer>
    </div>
  )
}
