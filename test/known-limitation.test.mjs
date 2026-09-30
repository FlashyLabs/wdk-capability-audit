// Pins the honesty of this tool's central, unverified assumption so it cannot
// be quietly dropped.
//
// The tool's whole heuristic — chains are declared at `wdk.chains` in a
// package's own package.json — has NOT been confirmed against any shipping
// `@tetherto/wdk-*` release. Against every real WDK package inspected while
// building this, that shape is absent, so inspectModule() returns
// `unrecognized-shape` / 0 chains. That is the tool refusing to guess, by
// design — not a clean bill of health.
//
// Two things must stay true, and each is a real failure shape if it stops:
//
//   1. The limitation is documented, prominently, in the README AND CLAUDE.md.
//      A doc that quietly loses this note turns an honest refusal into what
//      reads like a clean report. This test fails if either note is watered
//      down or removed.
//   2. A package shaped like the REAL packages (no `wdk.chains`) classifies as
//      `unrecognized-shape`, never as `inspected`/0-chains-that-looks-clean.
//      This captures the behaviour on real-shaped input so it can be updated
//      the day the real convention is confirmed — not before.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { discoverWdkPackages } from '../src/discover.js'
import { inspectModule } from '../src/inspect.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = dirname(HERE)
const POPULATED = join(HERE, 'fixtures', 'populated')

// The exact clauses the docs must keep. Each appears verbatim in both files;
// dropping or softening any one is what this test is here to catch.
const REQUIRED_PHRASES = [
  'Known limitation',
  'chain-declaration convention is unverified against a shipping',
  'unrecognized-shape',
  '0 chains',
]

for (const doc of ['README.md', 'CLAUDE.md']) {
  test(`${doc} documents the unverified-convention limitation, prominently and in full`, () => {
    const text = readFileSync(join(ROOT, doc), 'utf8')
    for (const phrase of REQUIRED_PHRASES) {
      assert.ok(
        text.includes(phrase),
        `${doc} no longer contains "${phrase}" — the known-limitation note has been dropped or watered down`
      )
    }
  })
}

test('a package with NO wdk.chains (the real @tetherto/wdk-* shape) classifies as unrecognized-shape, not a clean 0-chains report', () => {
  const pkg = discoverWdkPackages(POPULATED).find((p) => p.name === '@tetherto/wdk-wallet-evm')
  assert.ok(pkg, 'fixture setup: expected to discover @tetherto/wdk-wallet-evm')

  // The fixture must actually mirror the real shape: no wdk.chains at all.
  const manifest = JSON.parse(readFileSync(join(pkg.dir, 'package.json'), 'utf8'))
  assert.equal(manifest.wdk, undefined, 'fixture drift: the real-shaped fixture must declare no wdk key')

  const result = inspectModule(pkg)
  // The distinction that matters: unrecognized-shape (a named refusal), NOT
  // `inspected` with an empty chain list (which would read as a clean audit).
  assert.equal(result.status, 'unrecognized-shape')
  assert.notEqual(result.status, 'inspected')
  assert.deepEqual(result.chains, [])
})
