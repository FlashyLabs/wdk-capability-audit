#!/usr/bin/env node
// wdk-capability-audit.manifest.json — generated from the code, never
// written by hand. The one machine-readable statement of what this package
// scans for, what it refuses to guess, and the report contract it emits.
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { REPORT_CONTRACT, CLASSIFICATIONS, INSPECTION_STATUSES } from './codes.js'
import { CHAIN_REGISTRY_VERSION, listRegisteredChains } from './registry.js'
import { FAUCET_REGISTRY_VERSION, listFaucets, listNoFaucetByDesign } from './faucets.js'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))

export function build() {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
  return {
    contract: 'wdk-capability-audit-manifest/1',
    name: '@flashylabs/wdk-capability-audit',
    module: { package: pkg.name, version: pkg.version },
    reportContract: REPORT_CONTRACT,
    inspectionStatuses: INSPECTION_STATUSES,
    classifications: CLASSIFICATIONS,
    chainRegistryVersion: CHAIN_REGISTRY_VERSION,
    registeredChains: listRegisteredChains(),
    faucetRegistryVersion: FAUCET_REGISTRY_VERSION,
    faucets: listFaucets(),
    noFaucetByDesign: listNoFaucetByDesign(),
    scans: [
      '<dir>/node_modules/@tetherto/wdk-* — the umbrella @tetherto/wdk package itself (no suffix) is out of scope by this pattern',
    ],
    refuses: [
      'a package whose declared chain configuration does not match the assumed wdk.chains shape — status unrecognized-shape, never guessed at',
      'a package.json that cannot be read or parsed — status unreadable, never treated as zero chains',
      'a chain identifier absent from the hand-maintained registry — classification unknown, never inferred',
      'reporting a scan that found zero @tetherto/wdk-* packages as a clean result — the CLI exits non-zero instead',
      'a caller-supplied summary — summary is always computed from the packages array, never accepted as input',
    ],
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = join(ROOT, 'wdk-capability-audit.manifest.json')
  const text = JSON.stringify(build(), null, 2) + '\n'
  if (process.argv.includes('--write')) { writeFileSync(out, text); console.log('wrote wdk-capability-audit.manifest.json') }
  else if (process.argv.includes('--check')) { const ok = readFileSync(out, 'utf8') === text; console.log(ok ? 'ok — manifest current' : 'STALE — run npm run manifest'); process.exit(ok ? 0 : 1) }
  else process.stdout.write(text)
}
