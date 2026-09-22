import { test } from 'node:test'
import assert from 'node:assert/strict'
import { classifyChain, listRegisteredChains, CHAIN_REGISTRY_VERSION } from '../src/registry.js'
import { CLASSIFICATIONS } from '../src/codes.js'

test('classifyChain(): well-known EVM chain ids classify correctly', () => {
  assert.equal(classifyChain('evm', 1), 'mainnet') // Ethereum mainnet
  assert.equal(classifyChain('evm', 11155111), 'testnet') // Sepolia
  assert.equal(classifyChain('evm', 8453), 'mainnet') // Base mainnet
  assert.equal(classifyChain('evm', 84532), 'testnet') // Base Sepolia
})

test('classifyChain(): well-known Tron networks classify correctly', () => {
  assert.equal(classifyChain('tron', 'mainnet'), 'mainnet')
  assert.equal(classifyChain('tron', 'nile'), 'testnet')
  assert.equal(classifyChain('tron', 'shasta'), 'testnet')
})

test('classifyChain(): well-known Bitcoin networks classify correctly', () => {
  assert.equal(classifyChain('bitcoin', 'mainnet'), 'mainnet')
  assert.equal(classifyChain('bitcoin', 'testnet3'), 'testnet')
})

test('classifyChain(): the central doctrine — anything not in the registry is "unknown", never a guess', () => {
  assert.equal(classifyChain('evm', 999999999), 'unknown')
  assert.equal(classifyChain('evm', 5), 'unknown') // Goerli — deprecated, deliberately not registered
  assert.equal(classifyChain('tron', 'some-future-testnet'), 'unknown')
  assert.equal(classifyChain('solana', 'mainnet-beta'), 'unknown') // no namespace for a chain family that was never added
  assert.equal(classifyChain('made-up-namespace', 1), 'unknown')
})

test('classifyChain(): never throws on a malformed id — refuses to "unknown" instead', () => {
  assert.equal(classifyChain('evm', undefined), 'unknown')
  assert.equal(classifyChain('evm', null), 'unknown')
  assert.equal(classifyChain('evm', {}), 'unknown')
  assert.equal(classifyChain(undefined, 1), 'unknown')
  assert.equal(classifyChain('', 1), 'unknown')
})

test('classifyChain(): a numeric id and its string form key to the same registry entry', () => {
  // The registry is keyed on `${namespace}:${id}` via template literal, so
  // 1 (number) and "1" (string) both produce "evm:1" and both hit the same
  // entry — verify that is actually true rather than assumed, since
  // inspectModule() may see either depending on how a package wrote its id.
  assert.equal(classifyChain('evm', 1), classifyChain('evm', '1'))
})

test('listRegisteredChains(): every classification in the registry is one of the closed vocabulary', () => {
  const chains = listRegisteredChains()
  assert.ok(chains.length > 0)
  for (const entry of chains) {
    assert.ok(CLASSIFICATIONS.includes(entry.classification))
    assert.ok(typeof entry.namespace === 'string' && entry.namespace.length > 0)
  }
})

test('listRegisteredChains(): every entry round-trips through classifyChain() to the same classification', () => {
  for (const entry of listRegisteredChains()) {
    // ids were flattened to strings by listRegisteredChains(); classifyChain must still match since "1" and 1 key the same.
    assert.equal(classifyChain(entry.namespace, entry.id), entry.classification)
  }
})

test('CHAIN_REGISTRY_VERSION is a non-empty string', () => {
  assert.equal(typeof CHAIN_REGISTRY_VERSION, 'string')
  assert.ok(CHAIN_REGISTRY_VERSION.length > 0)
})
