// Address of the deployed Helix contract. Set this after running the
// Foundry deploy script (see USAGE.md) — Anvil's first deployment from the
// default account is deterministic and will normally be this address, but
// always confirm it against your `forge script` output.
export const HELIX_CONTRACT_ADDRESS =
  import.meta.env.VITE_HELIX_CONTRACT_ADDRESS ||
  '0x5FbDB2315678afecb367f032d93F642f64180aa'

// Minimal ABI — only what the frontend needs: the write function, the three
// read/view functions, and the event used for optimistic UI updates.
export const HELIX_ABI = [
  {
    type: 'function',
    name: 'uploadFile',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'filename', type: 'string' },
      { name: 'cid', type: 'string' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getFiles',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'string[]' }],
  },
  {
    type: 'function',
    name: 'getVersions',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'filename', type: 'string' },
    ],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'cid', type: 'string' },
          { name: 'version', type: 'uint256' },
          { name: 'timestamp', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getVersionCount',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'filename', type: 'string' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getLatestCid',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'filename', type: 'string' },
    ],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    type: 'event',
    name: 'FileUploaded',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'filename', type: 'string', indexed: false },
      { name: 'cid', type: 'string', indexed: false },
      { name: 'version', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
    anonymous: false,
  },
]
