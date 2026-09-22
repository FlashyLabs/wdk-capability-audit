import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildReport, deriveSummary, validateReport, REPORT_SCHEMA } from '../src/report.js'
import { REPORT_CONTRACT } from '../src/codes.js'

const SAMPLE_PACKAGES = [
  {
    name: '@tetherto/wdk-wallet-evm',
    version: '1.0.0-beta.19',
    status: 'unrecognized-shape',
    chains: [],
  },
  {
    name: '@tetherto/wdk-example-chain-config',
    version: '0.0.1-fixture',
    status: 'inspected',
    chains: [
      { chain: 'evm:1', classification: 'mainnet', source: 'package.json#/wdk/chains/ethereum-mainnet' },
      { chain: 'evm:11155111', classification: 'testnet', source: 'package.json#/wdk/chains/sepolia' },
      { chain: 'evm:999999999', classification: 'unknown', source: 'package.json#/wdk/chains/unknown-l2' },
    ],
  },
  {
    name: '@tetherto/wdk-broken-package',
    version: null,
    status: 'unreadable',
    chains: [],
  },
]

test('buildReport(): sets the report contract', () => {
  const report = buildReport({ dir: '/x', packages: [] })
  assert.equal(report.contract, REPORT_CONTRACT)
  assert.equal(report.contract, 'wdk-capability-audit-report/1')
})

test('buildReport(): tool name/version come from this package\'s own package.json', () => {
  const report = buildReport({ dir: '/x', packages: [] })
  assert.equal(report.tool.name, '@flashylabs/wdk-capability-audit')
  assert.equal(typeof report.tool.version, 'string')
})

test('buildReport(): generatedAt is a valid ISO timestamp, and uses an injected "now" when given', () => {
  const now = new Date('2026-01-01T00:00:00.000Z')
  const report = buildReport({ dir: '/x', packages: [], now })
  assert.equal(report.generatedAt, '2026-01-01T00:00:00.000Z')
})

test('buildReport(): summary is derived correctly from the packages array', () => {
  const report = buildReport({ dir: '/x', packages: SAMPLE_PACKAGES })
  assert.deepEqual(report.summary, {
    packagesScanned: 3,
    packagesInspected: 1,
    packagesUnrecognizedShape: 1,
    packagesUnreadable: 1,
    chainsTotal: 3,
    chainsByClassification: { mainnet: 1, testnet: 1, unknown: 1 },
  })
})

test('buildReport(): summary matches deriveSummary(packages) exactly, always', () => {
  const report = buildReport({ dir: '/x', packages: SAMPLE_PACKAGES })
  assert.deepEqual(report.summary, deriveSummary(SAMPLE_PACKAGES))
})

test('buildReport(): has no call shape that accepts a caller-supplied summary', () => {
  // buildReport destructures {dir, packages, now} only — an extra `summary`
  // key in the options object is silently ignored, never read.
  const report = buildReport({
    dir: '/x',
    packages: SAMPLE_PACKAGES,
    summary: { packagesScanned: 999, packagesInspected: 999, packagesUnrecognizedShape: 0, packagesUnreadable: 0, chainsTotal: 0, chainsByClassification: { mainnet: 0, testnet: 0, unknown: 0 } },
  })
  assert.deepEqual(report.summary, deriveSummary(SAMPLE_PACKAGES))
  assert.notEqual(report.summary.packagesScanned, 999)
})

test('buildReport(): the returned report and its nested objects are frozen', () => {
  const report = buildReport({ dir: '/x', packages: SAMPLE_PACKAGES })
  assert.ok(Object.isFrozen(report))
  assert.ok(Object.isFrozen(report.summary))
  assert.ok(Object.isFrozen(report.packages[0]))
})

test('buildReport(): throws on a missing/invalid dir or packages, rather than producing a malformed report', () => {
  assert.throws(() => buildReport({ packages: [] }), TypeError)
  assert.throws(() => buildReport({ dir: '/x' }), TypeError)
  assert.throws(() => buildReport({ dir: '', packages: [] }), TypeError)
})

test('validateReport(): a well-formed report has zero problems', () => {
  const report = buildReport({ dir: '/x', packages: SAMPLE_PACKAGES })
  assert.deepEqual(validateReport(report), [])
})

test('validateReport(): catches a hand-tampered summary that disagrees with packages', () => {
  const report = buildReport({ dir: '/x', packages: SAMPLE_PACKAGES })
  const tampered = { ...report, summary: { ...report.summary, chainsTotal: 999 } }
  const problems = validateReport(tampered)
  assert.ok(problems.length > 0)
  assert.ok(problems.some((p) => p.includes('summary')))
})

test('validateReport(): catches a wrong contract string', () => {
  const report = buildReport({ dir: '/x', packages: SAMPLE_PACKAGES })
  const tampered = { ...report, contract: 'something-else/1' }
  assert.ok(validateReport(tampered).length > 0)
})

test('validateReport(): catches a missing required field', () => {
  const report = buildReport({ dir: '/x', packages: SAMPLE_PACKAGES })
  const { generatedAt, ...tampered } = report
  void generatedAt
  const problems = validateReport(tampered)
  assert.ok(problems.some((p) => p.includes('generatedAt')))
})

test('validateReport(): catches an unrecognized classification value', () => {
  const report = buildReport({ dir: '/x', packages: SAMPLE_PACKAGES })
  const tampered = JSON.parse(JSON.stringify(report))
  tampered.packages[1].chains[0].classification = 'probably-mainnet'
  assert.ok(validateReport(tampered).length > 0)
})

test('validateReport(): catches an unexpected extra property (additionalProperties: false)', () => {
  const report = buildReport({ dir: '/x', packages: SAMPLE_PACKAGES })
  const tampered = { ...report, extraField: 'not part of the contract' }
  const problems = validateReport(tampered)
  assert.ok(problems.some((p) => p.includes('extraField')))
})

test('REPORT_SCHEMA: is itself a valid-looking JSON Schema draft 2020-12 document', () => {
  assert.equal(REPORT_SCHEMA['$schema'], 'https://json-schema.org/draft/2020-12/schema')
  assert.equal(REPORT_SCHEMA.type, 'object')
  assert.ok(Array.isArray(REPORT_SCHEMA.required))
})
