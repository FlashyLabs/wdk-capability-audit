// Builds and validates the report this package's entire job is to produce.
// `summary` is arithmetic over `packages`, computed here and only here —
// buildReport() does not accept a `summary` argument at all, so there is no
// call shape through which a caller could pass one in that disagrees with
// the packages array. validateReport() then checks that discipline held,
// for a report that reaches this code some other way (read from disk,
// assembled by hand in a test, etc).
'use strict'

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { REPORT_CONTRACT, CLASSIFICATIONS, INSPECTION_STATUSES } from './codes.js'
import { validateAgainstSchema } from './schema-validate.js'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const PKG = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
const SCHEMA = JSON.parse(readFileSync(join(ROOT, 'schema', 'report.schema.json'), 'utf8'))

/**
 * @typedef {object} InspectedPackage
 * @property {string} name
 * @property {string|null} version
 * @property {'inspected'|'unrecognized-shape'|'unreadable'} status
 * @property {import('./inspect.js').ChainFinding[]} chains
 */

/**
 * @typedef {object} ChainClassificationCounts
 * @property {number} mainnet
 * @property {number} testnet
 * @property {number} unknown
 */

/**
 * @typedef {object} ReportSummary
 * @property {number} packagesScanned
 * @property {number} packagesInspected
 * @property {number} packagesUnrecognizedShape
 * @property {number} packagesUnreadable
 * @property {number} chainsTotal
 * @property {ChainClassificationCounts} chainsByClassification
 */

/**
 * @typedef {object} AuditReport
 * @property {'wdk-capability-audit-report/1'} contract
 * @property {{name: string, version: string}} tool
 * @property {string} generatedAt
 * @property {string} dir
 * @property {InspectedPackage[]} packages
 * @property {ReportSummary} summary
 */

/**
 * Compute the `summary` block from a `packages` array. Exported on its own
 * so a caller (or a test) can compute what a *correct* summary would be,
 * without going through buildReport() — used by validateReport() to check
 * an externally-supplied report's summary against the one its own packages
 * array implies.
 *
 * @param {InspectedPackage[]} packages
 * @returns {ReportSummary}
 */
export function deriveSummary(packages) {
  const summary = {
    packagesScanned: packages.length,
    packagesInspected: 0,
    packagesUnrecognizedShape: 0,
    packagesUnreadable: 0,
    chainsTotal: 0,
    chainsByClassification: { mainnet: 0, testnet: 0, unknown: 0 },
  }

  for (const pkg of packages) {
    if (pkg.status === 'inspected') summary.packagesInspected += 1
    else if (pkg.status === 'unrecognized-shape') summary.packagesUnrecognizedShape += 1
    else if (pkg.status === 'unreadable') summary.packagesUnreadable += 1

    for (const finding of pkg.chains ?? []) {
      summary.chainsTotal += 1
      if (finding.classification in summary.chainsByClassification) {
        summary.chainsByClassification[finding.classification] += 1
      }
    }
  }

  return summary
}

/**
 * @param {object} opts
 * @param {string} opts.dir - The directory that was scanned.
 * @param {InspectedPackage[]} opts.packages
 * @param {Date} [opts.now] - Injectable for deterministic tests.
 * @returns {AuditReport} A report conforming to `wdk-capability-audit-report/1`.
 */
export function buildReport({ dir, packages, now = new Date() }) {
  if (typeof dir !== 'string' || dir === '') {
    throw new TypeError('buildReport(): "dir" must be a non-empty string')
  }
  if (!Array.isArray(packages)) {
    throw new TypeError('buildReport(): "packages" must be an array')
  }

  return Object.freeze({
    contract: REPORT_CONTRACT,
    tool: Object.freeze({ name: PKG.name, version: PKG.version }),
    generatedAt: now.toISOString(),
    dir,
    packages: packages.map((pkg) => Object.freeze({
      name: pkg.name,
      version: pkg.version ?? null,
      status: pkg.status,
      chains: (pkg.chains ?? []).map((c) => Object.freeze({ ...c })),
    })),
    summary: Object.freeze(deriveSummary(packages)),
  })
}

/**
 * Validate a report against `schema/report.schema.json`, plus the one rule
 * the schema alone can't express: that `summary` is exactly what
 * `deriveSummary(packages)` would compute. Never throws — returns an array
 * of problem strings, empty meaning valid, the same convention the sibling
 * packages use for `validateEnvelope()` / `checkTerms()`.
 *
 * @param {AuditReport} report
 * @returns {string[]}
 */
export function validateReport(report) {
  const problems = validateAgainstSchema(SCHEMA, report)

  if (report && typeof report === 'object' && Array.isArray(report.packages) && report.summary) {
    const expected = deriveSummary(report.packages)
    if (JSON.stringify(expected) !== JSON.stringify(report.summary)) {
      problems.push(`$.summary: does not match what packages implies — expected ${JSON.stringify(expected)}, got ${JSON.stringify(report.summary)}`)
    }
    for (const pkg of report.packages) {
      if (pkg && typeof pkg.status === 'string' && !INSPECTION_STATUSES.includes(pkg.status)) {
        problems.push(`$.packages: status "${pkg.status}" is not one of ${JSON.stringify(INSPECTION_STATUSES)}`)
      }
      for (const chain of pkg?.chains ?? []) {
        if (chain && typeof chain.classification === 'string' && !CLASSIFICATIONS.includes(chain.classification)) {
          problems.push(`$.packages[].chains: classification "${chain.classification}" is not one of ${JSON.stringify(CLASSIFICATIONS)}`)
        }
      }
    }
  }

  return problems
}

export { SCHEMA as REPORT_SCHEMA }
