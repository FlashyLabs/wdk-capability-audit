#!/usr/bin/env node
// wdk-capability-audit CLI. Hand-rolled argv parsing — no dependency, same
// discipline as the rest of this package.
'use strict'

import { resolve } from 'node:path'
import { auditDirectory } from '../src/audit.js'

function parseArgs(argv) {
  const opts = { dir: process.cwd(), json: false, help: false }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--dir') {
      const value = argv[i + 1]
      if (!value) throw new Error('--dir requires a path argument')
      opts.dir = value
      i += 1
    } else if (arg.startsWith('--dir=')) {
      opts.dir = arg.slice('--dir='.length)
    } else if (arg === '--json') {
      opts.json = true
    } else if (arg === '--help' || arg === '-h') {
      opts.help = true
    } else {
      throw new Error(`unrecognized argument: ${arg}`)
    }
  }
  return opts
}

const HELP = `wdk-capability-audit — scan for installed @tetherto/wdk-* packages and
classify their declared chains as mainnet, testnet, or unknown.

Usage:
  wdk-capability-audit [--dir <path>] [--json]

Options:
  --dir <path>   Directory whose node_modules to scan (default: cwd)
  --json         Emit the full wdk-capability-audit-report/1 JSON to stdout
  -h, --help     Show this help

Exit codes:
  0   found and scanned at least one @tetherto/wdk-* package
  1   argument error, or zero @tetherto/wdk-* packages found (a refusal,
      never a silent empty "clean" report — see README)
`

function printTable(report) {
  if (report.packages.length === 0) return // caller already refused

  const rows = report.packages.map((pkg) => {
    const chainSummary = pkg.chains.length === 0
      ? '—'
      : pkg.chains.map((c) => `${c.chain}:${c.classification}`).join(', ')
    return [pkg.name, pkg.version ?? '(unknown)', pkg.status, chainSummary]
  })

  const headers = ['PACKAGE', 'VERSION', 'STATUS', 'CHAINS']
  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)))

  const line = (cells) => cells.map((c, i) => c.padEnd(widths[i])).join('  ')
  console.log(line(headers))
  console.log(widths.map((w) => '-'.repeat(w)).join('  '))
  for (const row of rows) console.log(line(row))

  console.log('')
  console.log(`${report.summary.packagesScanned} package(s) scanned — ` +
    `${report.summary.packagesInspected} inspected, ` +
    `${report.summary.packagesUnrecognizedShape} unrecognized-shape, ` +
    `${report.summary.packagesUnreadable} unreadable`)
  console.log(`${report.summary.chainsTotal} chain(s) found — ` +
    `${report.summary.chainsByClassification.mainnet} mainnet, ` +
    `${report.summary.chainsByClassification.testnet} testnet, ` +
    `${report.summary.chainsByClassification.unknown} unknown`)
}

function main(argv) {
  let opts
  try {
    opts = parseArgs(argv)
  } catch (err) {
    console.error(`wdk-capability-audit: ${err.message}`)
    console.error('Run with --help for usage.')
    process.exitCode = 1
    return
  }

  if (opts.help) {
    console.log(HELP)
    return
  }

  const dir = resolve(opts.dir)
  const report = auditDirectory(dir)

  if (report.packages.length === 0) {
    // The vacuity guard. A scan that resolves nothing must say so, loudly
    // and with a non-zero exit — never a `{ packages: [] }` report that
    // reads exactly like "we scanned everything and it's clean."
    console.error(`wdk-capability-audit: found no @tetherto/wdk-* packages under ${dir}/node_modules`)
    console.error('This is a refusal, not a clean result — nothing was audited because nothing matching was installed here.')
    process.exitCode = 1
    return
  }

  if (opts.json) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    printTable(report)
  }
}

main(process.argv.slice(2))
