// A small, hand-maintained table of chain identifiers this package is
// genuinely confident are real and correctly labeled — never a generated or
// scraped list. If a chain isn't in here, `classifyChain()` returns
// 'unknown', permanently, until a human adds it with a reason. Growing this
// table is the only way this package's answers change; there is no
// inference path, no heuristic, and no "probably" anywhere in it.
//
// Sources, all well-known and public:
//   - EVM chain IDs follow EIP-155 (https://eips.ethereum.org/EIPS/eip-155)
//     and are listed at https://chainlist.org. The ones below are the
//     handful this package's authors could each independently recite
//     without looking anything up: Ethereum mainnet and its two current
//     public testnets, plus the mainnet/testnet pair for four widely used
//     L2s. This list is deliberately short — see CONTRIBUTING.md for how to
//     extend it.
//   - Tron network names (mainnet, Nile, Shasta) are TRON's own public
//     testnet names (https://developers.tron.network/docs/networks).
//     TRON does not use EIP-155-style numeric chain IDs for these networks
//     in the way EVM chains do, so they are registered as strings.
//   - Bitcoin network names are Bitcoin Core's own chain identifiers
//     (bitcoin-cli's allowed -chain values: main, test, testnet4, signet,
//     regtest — https://bitcoincore.academy/testnets.html). testnet3 is
//     included for historical accuracy (it is still, factually, a testnet)
//     but Bitcoin Core has deprecated it: Core 28.0 added testnet4 (BIP 94)
//     as its intended replacement, and Core 30.0 (October 2025) removed
//     testnet3 support entirely. A caller auditing a live Bitcoin
//     integration in 2026 should treat a bare "testnet3" finding as a flag
//     worth raising on its own, not just a routine testnet classification.
'use strict'

/** Bump this whenever an entry is added, removed, or corrected. Carried into every report so a reader knows which table classified it. */
export const CHAIN_REGISTRY_VERSION = '2026-09-22'

const REGISTRY = new Map([
  // --- EVM (EIP-155 chainId) ---
  ['evm:1', 'mainnet'], // Ethereum mainnet
  ['evm:11155111', 'testnet'], // Sepolia
  ['evm:17000', 'testnet'], // Holesky
  ['evm:8453', 'mainnet'], // Base mainnet
  ['evm:84532', 'testnet'], // Base Sepolia
  ['evm:137', 'mainnet'], // Polygon PoS mainnet
  ['evm:80002', 'testnet'], // Polygon Amoy testnet
  ['evm:42161', 'mainnet'], // Arbitrum One
  ['evm:421614', 'testnet'], // Arbitrum Sepolia
  ['evm:10', 'mainnet'], // OP Mainnet
  ['evm:11155420', 'testnet'], // OP Sepolia
  ['evm:56', 'mainnet'], // BNB Smart Chain mainnet
  ['evm:97', 'testnet'], // BNB Smart Chain testnet

  // --- Tron (network name, not a numeric chainId) ---
  ['tron:mainnet', 'mainnet'],
  ['tron:nile', 'testnet'],
  ['tron:shasta', 'testnet'],

  // --- Bitcoin (network name) ---
  ['bitcoin:mainnet', 'mainnet'],
  ['bitcoin:testnet3', 'testnet'], // deprecated by Bitcoin Core 30.0 (Oct 2025) — see comment above
  ['bitcoin:testnet4', 'testnet'], // BIP 94, added Bitcoin Core 28.0 — testnet3's intended replacement
  ['bitcoin:signet', 'testnet'], // BIP 325
])

/**
 * Classify a `{namespace, id}` chain identifier against the registry above.
 * Returns 'unknown' for anything not listed — never a guess, and never
 * throws on a malformed input; it just can't recognize it either.
 *
 * @param {string} namespace - e.g. 'evm', 'tron', 'bitcoin'.
 * @param {string|number} id - e.g. 1, 11155111, 'mainnet', 'nile'.
 * @returns {'mainnet'|'testnet'|'unknown'}
 */
export function classifyChain(namespace, id) {
  if (typeof namespace !== 'string' || namespace === '') return 'unknown'
  if (typeof id !== 'string' && typeof id !== 'number') return 'unknown'
  return REGISTRY.get(`${namespace}:${id}`) ?? 'unknown'
}

/** The registry's contents, as a plain array of `{namespace, id, classification}` — read-only, for the manifest and for tests that want to enumerate it rather than probe it one id at a time. */
export function listRegisteredChains() {
  return [...REGISTRY.entries()].map(([key, classification]) => {
    const i = key.indexOf(':')
    return { namespace: key.slice(0, i), id: key.slice(i + 1), classification }
  })
}
