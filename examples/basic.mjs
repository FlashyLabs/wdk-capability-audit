// A runnable, end-to-end example against this repository's own test
// fixtures — no real @tetherto/wdk-* install required.
//
//   node examples/basic.mjs
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { auditDirectory, validateReport } from '../src/index.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const fixtureDir = join(HERE, '..', 'test', 'fixtures', 'populated')

const report = auditDirectory(fixtureDir)

console.log('--- summary ---')
console.log(report.summary)

console.log('\n--- packages ---')
for (const pkg of report.packages) {
  console.log(`${pkg.name}@${pkg.version ?? '(unknown)'} — ${pkg.status}`)
  for (const chain of pkg.chains) {
    console.log(`    ${chain.chain} -> ${chain.classification} (${chain.source})`)
  }
}

const problems = validateReport(report)
console.log('\n--- schema validation ---')
console.log(problems.length === 0 ? 'report conforms to schema/report.schema.json' : problems)
