import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { discoverWdkPackages } from '../src/discover.js'
import { inspectModule } from '../src/inspect.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const POPULATED = join(HERE, 'fixtures', 'populated')

function find(name) {
  const pkg = discoverWdkPackages(POPULATED).find((p) => p.name === name)
  assert.ok(pkg, `fixture setup: expected to discover ${name}`)
  return pkg
}

test('inspectModule(): refuses (unrecognized-shape) a package matching the real @tetherto/wdk-wallet-evm package.json — this is the central doctrine, not a gap', () => {
  const result = inspectModule(find('@tetherto/wdk-wallet-evm'))
  assert.equal(result.status, 'unrecognized-shape')
  assert.deepEqual(result.chains, [])
})

test('inspectModule(): recognizes the assumed wdk.chains shape and extracts every well-formed entry', () => {
  const result = inspectModule(find('@tetherto/wdk-example-chain-config'))
  assert.equal(result.status, 'inspected')

  const byChain = Object.fromEntries(result.chains.map((c) => [c.chain, c]))
  assert.equal(byChain['evm:1'].classification, 'mainnet')
  assert.equal(byChain['evm:11155111'].classification, 'testnet')
  assert.equal(byChain['evm:999999999'].classification, 'unknown')
  assert.equal(byChain['tron:mainnet'].classification, 'mainnet')
  assert.equal(byChain['tron:nile'].classification, 'testnet')
})

test('inspectModule(): every chain finding carries a source pointing back into the package.json', () => {
  const result = inspectModule(find('@tetherto/wdk-example-chain-config'))
  const ethereum = result.chains.find((c) => c.chain === 'evm:1')
  assert.equal(ethereum.source, 'package.json#/wdk/chains/ethereum-mainnet')
})

test('inspectModule(): a malformed entry inside an otherwise-recognized wdk.chains object is skipped, not a crash', () => {
  const result = inspectModule(find('@tetherto/wdk-example-chain-config'))
  // "bad-entry-missing-id" has a namespace but no id — must not appear, and must not have thrown getting here.
  assert.ok(!result.chains.some((c) => c.source.endsWith('bad-entry-missing-id')))
})

test('inspectModule(): an empty wdk.chains object is still "inspected" (recognized shape, zero chains) — not "unrecognized-shape"', () => {
  const result = inspectModule(find('@tetherto/wdk-empty-chains'))
  assert.equal(result.status, 'inspected')
  assert.deepEqual(result.chains, [])
})

test('inspectModule(): a package.json that failed to parse is "unreadable", never crashes, never reports chains', () => {
  const result = inspectModule(find('@tetherto/wdk-broken-package'))
  assert.equal(result.status, 'unreadable')
  assert.deepEqual(result.chains, [])
})

test('inspectModule(): never throws on a malformed input object', () => {
  assert.doesNotThrow(() => inspectModule(null))
  assert.doesNotThrow(() => inspectModule(undefined))
  assert.doesNotThrow(() => inspectModule({}))
  assert.equal(inspectModule(null).status, 'unreadable')
})
