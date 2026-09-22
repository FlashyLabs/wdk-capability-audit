import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getFaucet, listFaucets, listNoFaucetByDesign, FAUCET_REGISTRY_VERSION } from '../src/faucets.js'
import { classifyChain, listRegisteredChains } from '../src/registry.js'

test('getFaucet(): a listed testnet chain returns a real-looking {name, url}', () => {
  const f = getFaucet('evm', 11155111)
  assert.ok(f)
  assert.equal(typeof f.name, 'string')
  assert.ok(f.name.length > 0)
  assert.match(f.url, /^https:\/\//)
})

test('getFaucet(): an unlisted chain returns null, never a guess', () => {
  assert.equal(getFaucet('evm', 999999999), null)
  assert.equal(getFaucet('made-up-namespace', 1), null)
})

test('getFaucet(): never throws on a malformed input', () => {
  assert.doesNotThrow(() => getFaucet(null, undefined))
  assert.doesNotThrow(() => getFaucet(123, {}))
  assert.equal(getFaucet(null, undefined), null)
})

test('getFaucet(): returns a fresh copy each call — a caller cannot mutate the registry through it', () => {
  const a = getFaucet('evm', 11155111)
  a.url = 'https://tampered.example'
  const b = getFaucet('evm', 11155111)
  assert.notEqual(b.url, 'https://tampered.example')
})

test('listFaucets(): every entry is a testnet chain in the chain registry — never a mainnet, never an unregistered chain', () => {
  for (const f of listFaucets()) {
    assert.equal(classifyChain(f.namespace, f.id), 'testnet',
      `${f.namespace}:${f.id} has a faucet listed but is not classified testnet`)
  }
})

test('listFaucets(): every URL looks like a real https URL', () => {
  for (const f of listFaucets()) {
    assert.match(f.url, /^https:\/\/\S+$/, `${f.namespace}:${f.id}'s url "${f.url}" doesn't look like a real URL`)
  }
})

test('listFaucets(): no duplicate chain entries', () => {
  const keys = listFaucets().map((f) => `${f.namespace}:${f.id}`)
  assert.equal(new Set(keys).size, keys.length)
})

test('listNoFaucetByDesign(): every entry is itself a real testnet chain in the registry, and carries a real reason', () => {
  const registered = new Set(listRegisteredChains().map((c) => `${c.namespace}:${c.id}`))
  for (const n of listNoFaucetByDesign()) {
    assert.ok(registered.has(`${n.namespace}:${n.id}`), `${n.namespace}:${n.id} is not even in the chain registry`)
    assert.equal(classifyChain(n.namespace, n.id), 'testnet')
    assert.ok(n.reason.length > 20, 'a no-faucet-by-design entry needs a real reason, not a placeholder')
  }
})

test('listNoFaucetByDesign() and listFaucets() never overlap — a chain is either listed or explained, never both', () => {
  const withFaucet = new Set(listFaucets().map((f) => `${f.namespace}:${f.id}`))
  const withoutFaucet = new Set(listNoFaucetByDesign().map((n) => `${n.namespace}:${n.id}`))
  for (const key of withFaucet) assert.ok(!withoutFaucet.has(key), `${key} is in both tables`)
})

test('bitcoin:testnet3 is deliberately unlisted — deprecated by Bitcoin Core, not silently dropped', () => {
  assert.equal(getFaucet('bitcoin', 'testnet3'), null)
  const reasons = listNoFaucetByDesign()
  const entry = reasons.find((n) => n.namespace === 'bitcoin' && n.id === 'testnet3')
  assert.ok(entry, 'bitcoin:testnet3 should appear in listNoFaucetByDesign()')
  assert.match(entry.reason, /removed|deprecat/i)
})

test('FAUCET_REGISTRY_VERSION is a non-empty string', () => {
  assert.equal(typeof FAUCET_REGISTRY_VERSION, 'string')
  assert.ok(FAUCET_REGISTRY_VERSION.length > 0)
})
