# Helix — Usage Guide

Full walkthrough to get Helix running on **Linux or Windows**, from a bare checkout to
uploading your first versioned file — locally against Anvil, and on the **Sepolia testnet**.

## Prerequisites

- **[Foundry](https://book.getfoundry.sh/getting-started/installation)** (gives you `forge`,
  `anvil`, and `cast`)
- **[Node.js](https://nodejs.org/)** 18+ and npm
- **[MetaMask](https://metamask.io/)** installed in your browser
- A free **[Pinata](https://pinata.cloud)** account (for the IPFS pinning JWT)

### Installing Foundry

**Linux / macOS / WSL:**
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

**Windows (native):** Foundry recommends using WSL. If you'd rather run natively, download a
prebuilt release from the [Foundry releases page](https://github.com/foundry-rs/foundry/releases)
and add it to your `PATH`. Everything below works identically once `forge`/`anvil` are on
your `PATH`, on either OS.

Verify install:
```bash
forge --version
anvil --version
```

---

## 1. Start Anvil (local test blockchain)

Open a terminal and run:

```bash
anvil
```

Leave this running. Anvil starts a local chain at `http://127.0.0.1:8545` (chain id `31337`)
and prints **10 funded test accounts** with their private keys, e.g.:

```
Available Accounts
==================
(0) 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
...
Private Keys
==================
(0) 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
...
```

Keep note of account `(0)` — its private key is used to deploy in the next step, and you'll
import it into MetaMask afterwards.

---

## 2. Deploy the Helix contract

In a **new** terminal, from the project root:

```bash
cd contracts

# install the forge-std testing/scripting library (one-time)
forge install foundry-rs/forge-std --no-commit

# copy the env template and confirm PRIVATE_KEY matches Anvil account (0)
cp .env.example .env

# build the contract
forge build

# run the test suite — should print "7 passed; 0 failed"
forge test

# deploy to your running Anvil node
source .env
forge script script/Deploy.s.sol:DeployHelix \
  --rpc-url $RPC_URL \
  --broadcast
```

> **Using PowerShell instead of bash?** `source` doesn't exist in pwsh. `PRIVATE_KEY` is
> read automatically from `.env` by the deploy script either way, so just paste the RPC URL
> directly: `forge script script/Deploy.s.sol:DeployHelix --rpc-url http://127.0.0.1:8545 --broadcast`.

The script logs the deployed address, e.g.:
```
Helix deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa
```

With a freshly started Anvil node and account `(0)` as deployer, this address is
deterministic and will normally match the default already baked into
`frontend/.env.example`. **Copy the address it prints anyway** — you'll need it in step 3.

> **Deploying to Sepolia instead of Anvil?** Skip straight to
> [Deploying to a public testnet](#deploying-to-a-public-testnet-sepolia) below, then come
> back to step 3 with the Sepolia address and RPC URL it gives you.

---

## 3. Configure and run the frontend

In a **new** terminal, from the project root:

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `frontend/.env`:

- `VITE_PINATA_JWT` — your Pinata JWT (Pinata dashboard → **API Keys** → **New Key** →
  enable `pinFileToIPFS` → copy the JWT).
- `VITE_HELIX_CONTRACT_ADDRESS` — the address printed in step 2.
- `VITE_CHAIN` — `anvil` for local dev (default), `sepolia` if you deployed to the testnet
  in the box above.
- `VITE_RPC_URL` — leave as `http://127.0.0.1:8545` for local Anvil; use your Sepolia RPC URL
  if `VITE_CHAIN=sepolia`.
- `VITE_WALLETCONNECT_PROJECT_ID` — optional but recommended: create a free project at
  [cloud.walletconnect.com](https://cloud.walletconnect.com) for a smoother RainbowKit
  connect flow.

Run the frontend's own test suite (pure-function unit tests — no chain or wallet needed):

```bash
npm run test
```

Start the dev server:

```bash
npm run dev
```

Vite will print a local URL, typically `http://localhost:5173`. Open it in any modern
browser (Chrome, Edge, Firefox) on Linux or Windows.

---

## 4. Connect MetaMask

**If you're running against local Anvil:**

1. Open MetaMask → **networks dropdown** → **Add network** → **Add a network manually**.
2. Enter:
   - Network name: `Anvil Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency symbol: `ETH`
3. Import one of Anvil's funded test accounts: MetaMask → **account menu** → **Import
   account** → paste one of the private keys Anvil printed in step 1 (use an account other
   than the deployer if you want a clean "user" wallet, or reuse the deployer — either
   works).
4. Switch MetaMask to the **Anvil Local** network.

**If you're running against Sepolia:**

1. MetaMask ships with Sepolia already available — just open the networks dropdown and
   enable **Show test networks**, then switch to **Sepolia**.
2. Make sure the wallet you connect with holds Sepolia ETH (see the faucet step below) if
   you plan to upload files yourself, or is any wallet at all if you only plan to *view*
   someone else's history.
3. If Helix loads on the wrong network, the app shows a banner with a one-click **Switch
   network** button — you don't have to do this manually every time.

---

## 5. Use Helix

1. In the Helix web app, click **Connect Wallet** and approve the MetaMask connection.
2. Click **Upload file**, choose a file from your machine, optionally rename it, and submit.
   - The file is pinned to IPFS via Pinata (progress bar shown).
   - MetaMask will then prompt you to confirm the on-chain transaction that appends this CID
     as version 1.
3. The dashboard now shows the file with **v1** in its history. Click the card to expand its
   version history.
4. To update the file, click **+ New version** on that file's card, pick the new local file,
   and confirm again — this appends **v2**, **v3**, etc., without ever touching v1.
5. Click **View** to open any version straight from IPFS, or **Download** to save it to your
   machine.
6. Click **Share** (top of the dashboard) to copy a link (`/view/0xYourAddress`) that anyone
   can open to browse your file history — no wallet needed on their end.
7. **(V2) Add a collaborator** — click **Collaborators**, paste another wallet address, and
   click **Add**. That address can now upload new versions to *any* of your files, present
   or future — they do this from your share link (step 6): if their connected wallet is a
   collaborator, the link shows upload actions instead of being read-only for them. Click
   **Remove** to revoke access again at any time; this only affects future uploads, past
   versions they added stay in the history exactly as they were (nothing is ever deleted or
   rewritten). Each version's uploader address is shown in its history entry, so it's always
   clear who added what.

> **Note for hosting the built frontend as a static site** (Vercel/Netlify/GitHub Pages,
> etc.): the `/view/0x...` route is handled client-side, so the host needs an SPA fallback
> (serve `index.html` for unknown paths) or a direct link/refresh to that URL will 404.
> Vite's own dev server (`npm run dev`) does this automatically, so it only shows up once
> you deploy — check your host's docs for "SPA rewrite" or "history API fallback."

---

## Deploying to a public testnet (Sepolia)

Use this instead of step 2 when you want a deployment that anyone with a browser and a
wallet can reach — not just people on your machine.

1. **Get a deployer wallet.** Never reuse Anvil's default account (its private key is
   public and known to everyone) or any wallet holding real funds. Generate a fresh,
   throwaway one:
   ```bash
   cast wallet new
   ```
   This prints an address and private key — treat the private key as sensitive from this
   point on (don't commit it, don't paste it anywhere public).

2. **Fund it** with free Sepolia ETH from a faucet, using the address from step 1:
   - [Google Cloud Sepolia Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)
   - [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)

   Confirm it landed:
   ```bash
   cast balance <your-address> --rpc-url https://ethereum-sepolia-rpc.publicnode.com --ether
   ```

3. **Get an RPC URL.** A free public endpoint needs no signup:
   `https://ethereum-sepolia-rpc.publicnode.com` (or `https://rpc.sepolia.org`). For
   heavier use, a free [Alchemy](https://alchemy.com) or [Infura](https://infura.io) project
   gives you a more reliable dedicated URL.

4. **Configure `contracts/.env`:**
   ```
   PRIVATE_KEY=<the throwaway private key from step 1>
   RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
   ```

5. **Deploy:**
   ```bash
   cd contracts
   source .env
   forge script script/Deploy.s.sol:DeployHelix --rpc-url "$RPC_URL" --broadcast
   ```
   **In PowerShell**, skip `source` and pass the RPC URL directly instead (`PRIVATE_KEY` is
   picked up from `.env` automatically regardless of shell):
   ```powershell
   forge script script/Deploy.s.sol:DeployHelix --rpc-url https://ethereum-sepolia-rpc.publicnode.com --broadcast
   ```
   Note the deployed address it prints — you'll put it in `frontend/.env` as
   `VITE_HELIX_CONTRACT_ADDRESS` in step 3, along with `VITE_CHAIN=sepolia` and the same
   `RPC_URL` as `VITE_RPC_URL`.

6. **Verify the deployment landed** (independent of the frontend):
   ```bash
   cast code <deployed-address> --rpc-url "$RPC_URL"
   ```
   Any output other than `0x` confirms real bytecode is on-chain. You can also paste the
   address into [sepolia.etherscan.io](https://sepolia.etherscan.io) to see it (source
   verification on Etherscan is a separate, optional step, not required for the app to work).

---

## Troubleshooting

- **MetaMask shows the wrong balance / nonce errors** — if you restart Anvil, its state
  resets. In MetaMask, go to **Settings → Advanced → Clear activity tab data** to reset the
  cached nonce for your imported test account.
- **Transactions hang forever** — make sure Anvil (step 1) is still running and MetaMask is
  on the same network the frontend is configured for (`VITE_CHAIN` in `frontend/.env`).
- **Upload fails with a Pinata error** — double-check `VITE_PINATA_JWT` in `frontend/.env`
  has the `pinFileToIPFS` permission enabled, and restart `npm run dev` after editing `.env`
  (Vite only reads env vars at startup).
- **"Contract not deployed at this address"-style errors** — confirm
  `VITE_HELIX_CONTRACT_ADDRESS` in `frontend/.env` matches the address printed by your most
  recent `forge script ... --broadcast` run, and that `VITE_CHAIN`/`VITE_RPC_URL` point at
  the same chain you deployed to.
- **Sepolia transaction stuck pending** — public RPC endpoints are sometimes slow under
  load; check the address on [sepolia.etherscan.io](https://sepolia.etherscan.io) directly,
  or switch `RPC_URL`/`VITE_RPC_URL` to a dedicated Alchemy/Infura endpoint.
- **"Insufficient funds" deploying to Sepolia** — the deployer wallet needs Sepolia ETH; see
  the faucet step above. A `Helix` deploy costs well under 0.01 ETH in gas.
