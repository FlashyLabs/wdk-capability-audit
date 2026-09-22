// Reads one discovered package's declared chain/network configuration —
// and only that. See README "Status" for the full explanation of the
// assumption this file makes and why it is stated as an assumption rather
// than a fact.
//
// ASSUMED SHAPE (not yet verified against a live @tetherto/wdk-* package —
// see README): a package that wants to be understood by this tool declares
// its chains as a plain object at `wdk.chains` inside its own package.json,
// e.g.:
//
//   { "wdk": { "chains": { "ethereum-mainnet": { "namespace": "evm", "id": 1 } } } }
//
// This file never requires, imports, or evaluates the package's JS. It
// reads package.json as JSON, and nothing else — the same discipline
// discover.js uses, so scanning an untrusted node_modules tree never runs a
// line of that tree's code.
'use strict'

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { classifyChain } from './registry.js'

/**
 * @typedef {object} ChainFinding
 * @property {string} chain - `${namespace}:${id}`, e.g. `"evm:1"`.
 * @property {'mainnet'|'testnet'|'unknown'} classification
 * @property {string} source - A JSON-pointer-style path back to exactly where in the package's own package.json this finding came from, e.g. `"package.json#/wdk/chains/ethereum-mainnet"`.
 */

/**
 * @typedef {object} InspectionResult
 * @property {'inspected'|'unrecognized-shape'|'unreadable'} status
 * @property {ChainFinding[]} chains
 */

/**
 * @param {{dir: string, readable: boolean}} pkg - An entry from discoverWdkPackages().
 * @returns {InspectionResult}
 */
export function inspectModule(pkg) {
  if (!pkg || pkg.readable === false || typeof pkg.dir !== 'string' || pkg.dir === '') {
    return { status: 'unreadable', chains: [] }
  }

  let raw
  try {
    raw = JSON.parse(readFileSync(join(pkg.dir, 'package.json'), 'utf8'))
  } catch {
    return { status: 'unreadable', chains: [] }
  }

  const chainsNode = isPlainObject(raw) ? raw.wdk : undefined
  const chainsMap = isPlainObject(chainsNode) ? chainsNode.chains : undefined

  if (!isPlainObject(chainsMap)) {
    // The shape this tool assumes was not found. This is the refusal path:
    // return an explicit, named result. Never crash. Never guess a chain
    // list from anything else in the package (README, keywords, exports
    // map, ...) — an assumption that silently widens is an assumption that
    // silently lies.
    return { status: 'unrecognized-shape', chains: [] }
  }

  const chains = []
  for (const [label, entry] of Object.entries(chainsMap)) {
    if (!isPlainObject(entry)) continue
    const { namespace, id } = entry
    if (typeof namespace !== 'string' || namespace === '') continue
    if (typeof id !== 'string' && typeof id !== 'number') continue

    chains.push({
      chain: `${namespace}:${id}`,
      classification: classifyChain(namespace, id),
      source: `package.json#/wdk/chains/${label}`,
    })
  }

  return { status: 'inspected', chains }
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
