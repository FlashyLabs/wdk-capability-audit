// Wires discovery, inspection and report-building together. This is the one
// function the CLI calls; it is also unit-testable directly, without going
// through argv or a child process.
'use strict'

import { discoverWdkPackages } from './discover.js'
import { inspectModule } from './inspect.js'
import { buildReport } from './report.js'

/** @typedef {import('./report.js').AuditReport} AuditReport */

/**
 * @param {string} [dir] - Directory to scan. Defaults to process.cwd().
 * @param {Date} [now] - Injectable for deterministic tests.
 * @returns {AuditReport} A `wdk-capability-audit-report/1` report — even when
 *   `packages` is empty. Deciding that an empty result should refuse is the
 *   CLI's job (see bin/wdk-capability-audit.js), not this function's: a
 *   library caller may have a legitimate reason to want the empty report
 *   itself (e.g. to compose it into something else), so the refusal lives
 *   at the boundary that actually prints a claim to a human, not here.
 */
export function auditDirectory(dir = process.cwd(), now = new Date()) {
  const discovered = discoverWdkPackages(dir)

  const packages = discovered.map((pkg) => {
    const inspected = inspectModule(pkg)
    return {
      name: pkg.name,
      version: pkg.version,
      status: inspected.status,
      chains: inspected.chains,
    }
  })

  return buildReport({ dir, packages, now })
}
