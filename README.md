# Helix

**A Decentralized, Blockchain-Powered Version Control and Collaborative Storage App.**

Helix lets you connect a MetaMask wallet, upload files to IPFS, and record every version of
every file on-chain — a permanent, linear, tamper-evident history of who owns what and how it
changed over time. Your wallet address *is* your identity. There is no login, no server-side
database, and no central point of failure for your file history.

## How it works

1. **Connect** — You connect MetaMask (via RainbowKit). Your wallet address becomes your
   identity on the platform; nothing else is needed to "sign up."
2. **Upload** — You pick a file locally. Helix sends it straight from your browser to
   [Pinata](https://pinata.cloud)'s REST API, which pins it to IPFS and returns a
   **CID** (Content Identifier) — a hash that uniquely identifies the file's contents.
3. **Record** — Helix calls the `Helix` smart contract's `uploadFile(filename, cid)` function.
   The contract appends a new version — CID, version number, and timestamp — to that
   filename's history under your address. This is a strictly linear, append-only ledger:
   version numbers only ever go up, and past versions are never mutated or deleted.
4. **Browse & restore** — The dashboard reads your file list and version history straight
   from the chain. Click any version to view or download it directly from IPFS via its CID.

## Architecture

```
helix/
├── contracts/          Foundry project (Solidity smart contract + tests + deploy script)
│   ├── src/Helix.sol
│   ├── script/Deploy.s.sol
│   └── test/Helix.t.sol
└── frontend/            Vite + React + TailwindCSS single-page app
    ├── src/config/       wagmi/RainbowKit chain config, contract ABI + address
    ├── src/hooks/        useHelixContract — all on-chain reads/writes
    ├── src/utils/        Pinata upload + IPFS download helpers
    └── src/components/   Navbar, Dashboard, FileCard, VersionHistory, UploadModal
```

### Smart contract design

The contract is deliberately minimal — it stores **no file bytes on-chain**, only CIDs:

- `mapping(address => mapping(string => FileVersion[]))` — for each owner, for each filename,
  an append-only array of `{cid, version, timestamp}` entries. This is the "mapping of
  addresses to an array of CIDs" from the spec, extended just enough (keyed by filename, not
  only by address) so that a wallet can track more than one file with its own independent
  linear version history.
- `mapping(address => string[])` — the list of distinct filenames an owner has ever uploaded,
  used to populate the dashboard.
- **One write path**: `uploadFile(filename, cid)`. Every call appends a new version; there is
  no update-in-place and no delete. That's what makes the history linear and auditable.

### Tech stack

| Layer               | Technology                                   |
|---------------------|-----------------------------------------------|
| Smart contract       | Solidity, compiled & tested with **Foundry**  |
| Local chain          | **Anvil**                                     |
| File storage         | **IPFS**, pinned via the **Pinata REST API**  |
| Frontend build       | **Vite**                                      |
| UI                    | **React** + **TailwindCSS**                   |
| Wallet / chain access | **wagmi** + **viem** + **RainbowKit**        |

## Quick start

See **[USAGE.md](./USAGE.md)** for full step-by-step instructions to:

1. Install Foundry and start Anvil (local test blockchain)
2. Deploy the `Helix` contract to Anvil
3. Configure and run the frontend
4. Connect MetaMask to your local Anvil network
5. Upload a file and watch its version history grow

## Design notes / limitations

- This is a local-first / testnet-first reference implementation. To use on a public
  testnet or mainnet, update `contracts/.env`'s `PRIVATE_KEY`/`RPC_URL` and the frontend's
  `VITE_RPC_URL` / chain config in `src/config/wagmi.js`, then redeploy.
- Filenames are user-supplied strings, not filesystem paths — two uploads with the *same*
  tracked filename become versions of the *same* file; a different name starts a new file.
- IPFS pinning happens via your own Pinata account/JWT, kept client-side in `frontend/.env`.
  For a production deployment you'd normally proxy this through a small backend so the JWT
  is never shipped to the browser — this project intentionally keeps things serverless and
  simple for local development.
- Anyone can call `uploadFile` for *their own* address only (`msg.sender`) — there's no way
  for one wallet to write into another wallet's history.
