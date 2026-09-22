import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { auditDirectory } from '../src/audit.js'
import { validateReport } from '../src/report.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const FIXTURES = join(HERE, 'fixtures')

test('auditDirectory(): the full pipeline against the populated fixture produces a schema-conformant report', () => {
  const report = auditDirectory(join(FIXTURES, 'populated'))
  assert.deepEqual(validateReport(report), [])
})

test('auditDirectory(): every real-@tetherto-shaped fixture package is unrecognized-shape — the assumption gap is real and tested end to end', () => {
  const report = auditDirectory(join(FIXTURES, 'populated'))
  const evm = report.packages.find((p) => p.name === '@tetherto/wdk-wallet-evm')
  assert.ok(evm)
  assert.equal(evm.status, 'unrecognized-shape')
})

test('auditDirectory(): the assumed-shape fixture package classifies its chains correctly end to end', () => {
  const report = auditDirectory(join(FIXTURES, 'populated'))
  const example = report.packages.find((p) => p.name === '@tetherto/wdk-example-chain-config')
  assert.ok(example)
  assert.equal(example.status, 'inspected')
  const mainnetChains = example.chains.filter((c) => c.classification === 'mainnet')
  assert.ok(mainnetChains.length > 0)
})

test('auditDirectory(): against a directory with zero @tetherto/wdk-* packages, still returns a (library-level) report with an empty packages array', () => {
  // The refusal is the CLI's job (see cli.test.mjs) — the library function
  // itself must not throw or special-case an empty result; a caller
  // composing this into something larger may have its own reason to want it.
  const report = auditDirectory(join(FIXTURES, 'empty'))
  assert.deepEqual(report.packages, [])
  assert.equal(report.summary.packagesScanned, 0)
  assert.deepEqual(validateReport(report), [])
})

test('auditDirectory(): the report names the directory that was actually scanned', () => {
  const dir = join(FIXTURES, 'populated')
  const report = auditDirectory(dir)
  assert.equal(report.dir, dir)
})
