import FileCard from './FileCard.jsx'

export default function Dashboard({ files, isLoading, error, onNewUpload, onUploadNewVersion }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">Your files</h2>
          <p className="text-sm text-slate-400">
            Every file is content-addressed on IPFS and versioned on-chain.
          </p>
        </div>
        <button
          onClick={onNewUpload}
          className="rounded-lg bg-helix px-4 py-2 text-sm font-semibold text-white hover:bg-helix-light"
        >
          + Upload file
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-8 text-center text-slate-400">
          Loading files from chain…
        </div>
      )}

      {!isLoading && files.length === 0 && !error && (
        <div className="rounded-xl border border-dashed border-slate-800 px-4 py-12 text-center">
          <p className="text-slate-400">No files yet.</p>
          <p className="mt-1 text-sm text-slate-500">
            Upload your first file to start a version history.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {files.map((file) => (
          <FileCard key={file.filename} file={file} onUploadNewVersion={onUploadNewVersion} />
        ))}
      </div>
    </section>
  )
}
