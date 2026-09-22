// A small, hand-maintained table pointing each testnet chain this package
// recognizes (see registry.js) at one faucet — never generated, never
// scraped. Same discipline as the chain registry: a chain absent here
// returns `null` from `getFaucet()`, permanently, until a human adds an
// entry with a real source. This package's own code never fetches these
// URLs or checks whether they still work — "committed is not served," a
// listed faucet can go offline or change its terms at any time, and this
// table only says what was true when it was last verified.
//
// Every entry below was checked by web search on FAUCET_REGISTRY_VERSION's
// date, cross-referencing at least the linked page's own title or an
// official docs page naming it as a current faucet. Chains with no faucet
// found this way (or with only third-party mirrors this package's authors
// were not confident enough to call authoritative) are left out on
// purpose — see CONTRIBUTING.md for how to add one.
'use strict'

/** Bump alongside any addition, removal or URL correction. Carried into every faucet listing so a reader knows when it was last checked. */
export const FAUCET_REGISTRY_VERSION = '2026-09-22'

const FAUCETS = new Map([
  ['evm:11155111', { name: 'Google Cloud Web3 Faucet — Ethereum Sepolia', url: 'https://cloud.google.com/application/web3/faucet/ethereum/sepolia' }],
  ['evm:17000', { name: 'Google Cloud Web3 Faucet — Ethereum Holesky', url: 'https://cloud.google.com/application/web3/faucet/ethereum/holesky' }],
  ['evm:84532', { name: 'Base network faucets (official list, Base docs)', url: 'https://docs.base.org/base-chain/network-information/network-faucets' }],
  ['evm:80002', { name: 'Polygon Faucet (official, select Amoy)', url: 'https://faucet.polygon.technology/' }],
  ['evm:421614', { name: 'Chainlink Faucet — Arbitrum Sepolia', url: 'https://faucets.chain.link/arbitrum-sepolia' }],
  ['evm:11155420', { name: 'Superchain Dev Console Faucet — OP Sepolia (official, Optimism)', url: 'https://console.optimism.io/faucet' }],
  ['evm:97', { name: 'BNB Chain Testnet Faucet (official)', url: 'https://www.bnbchain.org/en/testnet-faucet' }],
  ['tron:nile', { name: 'Nile Testnet Faucet (official)', url: 'https://nileex.io/join/getJoinPage' }],
  ['tron:shasta', { name: 'TronGrid Shasta Faucet', url: 'https://www.trongrid.io/shasta/' }],
  ['bitcoin:testnet4', { name: 'coinfaucet.eu — Bitcoin testnet4', url: 'https://coinfaucet.eu/en/btc-testnet4/' }],
  ['bitcoin:signet', { name: 'Bitcoin Signet Faucet', url: 'https://signetfaucet.com/' }],
])

/**
 * A chain this package recognizes as testnet but deliberately lists no
 * faucet for, with the reason why — distinct from a chain nobody has
 * gotten around to adding yet.
 * @type {Map<string, string>}
 */
const NO_FAUCET_BY_DESIGN = new Map([
  ['bitcoin:testnet3', 'Bitcoin Core 30.0 (October 2025) removed testnet3 support entirely; Core 28.0 added testnet4 (BIP 94) as its intended replacement. Use bitcoin:testnet4 or bitcoin:signet instead.'],
])

/**
 * Look up the faucet listed for a `{namespace, id}` chain identifier.
 * Returns `null` for a chain with no faucet listed — never a guess, and
 * never throws on a malformed input.
 *
 * @param {string} namespace - e.g. 'evm', 'tron', 'bitcoin'.
 * @param {string|number} id - e.g. 11155111, 'nile', 'signet'.
 * @returns {{name: string, url: string}|null}
 */
export function getFaucet(namespace, id) {
  if (typeof namespace !== 'string' || namespace === '') return null
  if (typeof id !== 'string' && typeof id !== 'number') return null
  const entry = FAUCETS.get(`${namespace}:${id}`)
  return entry ? { ...entry } : null
}

/**
 * Every faucet this package lists, as a plain array — for the manifest,
 * the CLI's `--faucets` mode, and tests that want to enumerate the table
 * rather than probe it one chain at a time.
 * @returns {Array<{namespace: string, id: string, name: string, url: string}>}
 */
export function listFaucets() {
  return [...FAUCETS.entries()].map(([key, entry]) => {
    const i = key.indexOf(':')
    return { namespace: key.slice(0, i), id: key.slice(i + 1), ...entry }
  })
}

/**
 * Chains recognized as testnet in the chain registry that this table
 * deliberately lists no faucet for, with the reason — e.g. a deprecated
 * network. Distinct from a chain simply not yet added.
 * @returns {Array<{namespace: string, id: string, reason: string}>}
 */
export function listNoFaucetByDesign() {
  return [...NO_FAUCET_BY_DESIGN.entries()].map(([key, reason]) => {
    const i = key.indexOf(':')
    return { namespace: key.slice(0, i), id: key.slice(i + 1), reason }
  })
}
