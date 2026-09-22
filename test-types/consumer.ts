// Not run by `npm test` — this is a type-level smoke test, checked by
// `npm run test:types`. It imports the package exactly as a real TypeScript
// consumer would (through the package name, resolved to the built dist/
// declarations via this directory's tsconfig `paths`), so a change that
// breaks the published types breaks this file, not just the JS behaviour.
import {
  discoverWdkPackages,
  inspectModule,
  classifyChain,
  listRegisteredChains,
  buildReport,
  deriveSummary,
  validateReport,
  auditDirectory,
  REPORT_CONTRACT,
  INSPECTION_STATUSES,
  CLASSIFICATIONS,
  CHAIN_REGISTRY_VERSION,
} from '@flashylabs/wdk-capability-audit'

const found = discoverWdkPackages('/some/dir')
const first = found[0]

const inspected = inspectModule(first)
const status: 'inspected' | 'unrecognized-shape' | 'unreadable' = inspected.status
void status

const classification: 'mainnet' | 'testnet' | 'unknown' = classifyChain('evm', 1)
void classification

const registered = listRegisteredChains()
void registered

const report = buildReport({
  dir: '/some/dir',
  packages: [
    { name: '@tetherto/wdk-example', version: '1.0.0', status: 'inspected', chains: [] },
  ],
})

const summary = deriveSummary(report.packages)
void summary

const problems: string[] = validateReport(report)
void problems

const auto = auditDirectory('/some/dir')
void auto

const contract: string = REPORT_CONTRACT
const statuses: readonly string[] = INSPECTION_STATUSES
const classifications: readonly string[] = CLASSIFICATIONS
const registryVersion: string = CHAIN_REGISTRY_VERSION
void contract
void statuses
void classifications
void registryVersion

// @ts-expect-error — buildReport() takes no "summary" option; passing one is not part of the type, because summary is always derived, never accepted as input
buildReport({ dir: '/x', packages: [], summary: { packagesScanned: 0 } })

// @ts-expect-error — a package's status must be one of the three closed values, never an arbitrary string
buildReport({ dir: '/x', packages: [{ name: 'x', version: null, status: 'totally-fine', chains: [] }] })
