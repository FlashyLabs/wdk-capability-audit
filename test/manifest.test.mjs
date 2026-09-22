import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from '../src/manifest.js'
import { REPORT_CONTRACT, CLASSIFICATIONS, INSPECTION_STATUSES } from '../src/codes.js'
import { CHAIN_REGISTRY_VERSION } from '../src/registry.js'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))

test('build(): matches the committed wdk-capability-audit.manifest.json — run `npm run manifest` if this fails', () => {
  const committed = readFileSync(join(ROOT, 'wdk-capability-audit.manifest.json'), 'utf8')
  const fresh = JSON.stringify(build(), null, 2) + '\n'
  assert.equal(committed, fresh)
})

test('build(): reportContract, classifications, inspectionStatuses and chainRegistryVersion match src/codes.js and src/registry.js exactly — never a second, hand-kept copy', () => {
  const doc = build()
  assert.equal(doc.reportContract, REPORT_CONTRACT)
  assert.deepEqual(doc.classifications, CLASSIFICATIONS)
  assert.deepEqual(doc.inspectionStatuses, INSPECTION_STATUSES)
  assert.equal(doc.chainRegistryVersion, CHAIN_REGISTRY_VERSION)
})

test('build(): contract id and module name', () => {
  const doc = build()
  assert.equal(doc.contract, 'wdk-capability-audit-manifest/1')
  assert.equal(doc.module.package, '@flashylabs/wdk-capability-audit')
})
