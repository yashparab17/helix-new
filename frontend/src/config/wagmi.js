import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { defineChain } from 'viem'

// Local Anvil chain. Anvil's default chain id is 31337 and it serves
// JSON-RPC on http://127.0.0.1:8545 by default.
export const anvilLocal = defineChain({
  id: 31337,
  name: 'Anvil Local',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [import.meta.env.VITE_RPC_URL || 'http://127.0.0.1:8545'] },
  },
  testnet: true,
})

export const wagmiConfig = getDefaultConfig({
  appName: 'Helix',
  // Get a free project ID at https://cloud.walletconnect.com and put it in .env
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'HELIX_LOCAL_DEV_PLACEHOLDER',
  chains: [anvilLocal],
  ssr: false,
})
