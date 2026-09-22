import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { discoverWdkPackages } from '../src/discover.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const FIXTURES = join(HERE, 'fixtures')

test('discoverWdkPackages(): finds every @tetherto/wdk-* package and nothing else', () => {
  const found = discoverWdkPackages(join(FIXTURES, 'populated'))
  const names = found.map((p) => p.name)

  assert.ok(names.includes('@tetherto/wdk-wallet-evm'))
  assert.ok(names.includes('@tetherto/wdk-example-chain-config'))
  assert.ok(names.includes('@tetherto/wdk-broken-package'))
  assert.ok(names.includes('@tetherto/wdk-empty-chains'))
})

test('discoverWdkPackages(): excludes the bare @tetherto/wdk package (no "-" suffix), by design', () => {
  const found = discoverWdkPackages(join(FIXTURES, 'populated'))
  assert.ok(!found.some((p) => p.name === '@tetherto/wdk'), 'the umbrella package must not be matched by the wdk-* pattern')
})

test('discoverWdkPackages(): excludes a @tetherto-scoped package that is not wdk-prefixed', () => {
  const found = discoverWdkPackages(join(FIXTURES, 'populated'))
  assert.ok(!found.some((p) => p.name === '@tetherto/other-thing'))
})

test('discoverWdkPackages(): excludes packages outside the @tetherto scope entirely', () => {
  const found = discoverWdkPackages(join(FIXTURES, 'populated'))
  assert.ok(!found.some((p) => p.name === 'some-other-package'))
})

test('discoverWdkPackages(): reports name/version read straight from package.json', () => {
  const found = discoverWdkPackages(join(FIXTURES, 'populated'))
  const evm = found.find((p) => p.name === '@tetherto/wdk-wallet-evm')
  assert.ok(evm)
  assert.equal(evm.version, '1.0.0-beta.19')
  assert.equal(evm.readable, true)
})

test('discoverWdkPackages(): a package.json that fails to parse is reported, not skipped, marked unreadable', () => {
  const found = discoverWdkPackages(join(FIXTURES, 'populated'))
  const broken = found.find((p) => p.name === '@tetherto/wdk-broken-package')
  assert.ok(broken, 'an unreadable package must still be reported by name — unread is not zero')
  assert.equal(broken.readable, false)
  assert.equal(broken.version, null)
})

test('discoverWdkPackages(): a scope directory with nothing matching returns an empty array, not an error', () => {
  const found = discoverWdkPackages(join(FIXTURES, 'empty'))
  assert.deepEqual(found, [])
})

test('discoverWdkPackages(): a directory with no node_modules at all returns an empty array, not an error', () => {
  const found = discoverWdkPackages(join(FIXTURES, 'no-node-modules'))
  assert.deepEqual(found, [])
})

test('discoverWdkPackages(): defaults to process.cwd() when no directory is given', () => {
  // Just confirm it doesn't throw and returns an array — cwd during `npm test` is the package root, which has no @tetherto scope of its own.
  const found = discoverWdkPackages()
  assert.ok(Array.isArray(found))
})

test('discoverWdkPackages(): results are sorted by package name', () => {
  const found = discoverWdkPackages(join(FIXTURES, 'populated'))
  const names = found.map((p) => p.name)
  const sorted = [...names].sort((a, b) => a.localeCompare(b))
  assert.deepEqual(names, sorted)
})
