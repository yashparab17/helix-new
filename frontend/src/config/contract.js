// Address of the deployed Helix contract. Set this after running the
// Foundry deploy script (see USAGE.md) — Anvil's first deployment from the
// default account is deterministic and will normally be this address, but
// always confirm it against your `forge script` output.
export const HELIX_CONTRACT_ADDRESS =
  import.meta.env.VITE_HELIX_CONTRACT_ADDRESS ||
  '0x5FbDB2315678afecb367f032d93F642f64180aa'

// V2 ABI: uploadFile now takes an explicit `owner` (so collaborators can
// upload on someone else's behalf), FileVersion carries an `uploader`, and
// there are read/write functions for managing collaborators.
export const HELIX_ABI = [
  {
    type: 'function',
    name: 'uploadFile',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'owner', type: 'address' },
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
    name: 'getVisibleFiles',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'string[]' }],
  },
  {
    type: 'function',
    name: 'hideFile',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'filename', type: 'string' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'unhideFile',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'filename', type: 'string' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'isFileHidden',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'filename', type: 'string' },
    ],
    outputs: [{ name: '', type: 'bool' }],
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
          { name: 'uploader', type: 'address' },
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
    type: 'function',
    name: 'addCollaborator',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'collaborator', type: 'address' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'removeCollaborator',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'collaborator', type: 'address' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getCollaborators',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'address[]' }],
  },
  {
    type: 'function',
    name: 'isCollaborator',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'who', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'event',
    name: 'FileUploaded',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'uploader', type: 'address', indexed: true },
      { name: 'filename', type: 'string', indexed: false },
      { name: 'cid', type: 'string', indexed: false },
      { name: 'version', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'CollaboratorAdded',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'collaborator', type: 'address', indexed: true },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'CollaboratorRemoved',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'collaborator', type: 'address', indexed: true },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'FileHidden',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'filename', type: 'string', indexed: false },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'FileUnhidden',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'filename', type: 'string', indexed: false },
    ],
    anonymous: false,
  },
]
