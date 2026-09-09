# Helix — Usage Guide

Full walkthrough to get Helix running locally on **Linux or Windows**, from a bare checkout
to uploading your first versioned file.

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

# run the test suite
forge test

# deploy to your running Anvil node
source .env
forge script script/Deploy.s.sol:DeployHelix \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

The script logs the deployed address, e.g.:
```
Helix deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa
```

With a freshly started Anvil node and account `(0)` as deployer, this address is
deterministic and will normally match the default already baked into
`frontend/.env.example`. **Copy the address it prints anyway** — you'll need it in step 3.

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
- `VITE_RPC_URL` — leave as `http://127.0.0.1:8545` for local Anvil.
- `VITE_WALLETCONNECT_PROJECT_ID` — optional but recommended: create a free project at
  [cloud.walletconnect.com](https://cloud.walletconnect.com) for a smoother RainbowKit
  connect flow.

Start the dev server:

```bash
npm run dev
```

Vite will print a local URL, typically `http://localhost:5173`. Open it in any modern
browser (Chrome, Edge, Firefox) on Linux or Windows.

---

## 4. Connect MetaMask to Anvil

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

---

## Troubleshooting

- **MetaMask shows the wrong balance / nonce errors** — if you restart Anvil, its state
  resets. In MetaMask, go to **Settings → Advanced → Clear activity tab data** to reset the
  cached nonce for your imported test account.
- **Transactions hang forever** — make sure Anvil (step 1) is still running and MetaMask is
  on the `Anvil Local` network, not Ethereum Mainnet or another testnet.
- **Upload fails with a Pinata error** — double-check `VITE_PINATA_JWT` in `frontend/.env`
  has the `pinFileToIPFS` permission enabled, and restart `npm run dev` after editing `.env`
  (Vite only reads env vars at startup).
- **"Contract not deployed at this address"-style errors** — confirm
  `VITE_HELIX_CONTRACT_ADDRESS` in `frontend/.env` matches the address printed by your most
  recent `forge script ... --broadcast` run.
