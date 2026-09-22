import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateReport } from '../src/report.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = dirname(HERE)
const BIN = join(ROOT, 'bin', 'wdk-capability-audit.js')
const FIXTURES = join(HERE, 'fixtures')

function run(args) {
  try {
    const stdout = execFileSync(process.execPath, [BIN, ...args], { encoding: 'utf8' })
    return { status: 0, stdout, stderr: '' }
  } catch (err) {
    // execFileSync throws on non-zero exit; the useful bits are still on the error.
    return { status: err.status, stdout: err.stdout ?? '', stderr: err.stderr ?? '' }
  }
}

test('CLI vacuity guard: a directory with zero @tetherto/wdk-* packages refuses — non-zero exit, honest message, no fake "clean" report', () => {
  const result = run(['--dir', join(FIXTURES, 'empty')])
  assert.notEqual(result.status, 0, 'the CLI must exit non-zero when it finds nothing to audit')
  assert.ok(result.stderr.includes('found no @tetherto/wdk-* packages'), `stderr should say plainly that nothing was found; got: ${result.stderr}`)
  assert.ok(result.stderr.includes('refusal'), 'stderr should say this is a refusal, not a clean result')
  assert.equal(result.stdout.trim(), '', 'no report — human or JSON — should be printed on a refusal')
})

test('CLI vacuity guard: also refuses against a directory with no node_modules at all', () => {
  const result = run(['--dir', join(FIXTURES, 'no-node-modules')])
  assert.notEqual(result.status, 0)
  assert.ok(result.stderr.includes('found no @tetherto/wdk-* packages'))
})

test('CLI --json: against the populated fixture, emits valid JSON conforming to the report schema, and exits 0', () => {
  const result = run(['--dir', join(FIXTURES, 'populated'), '--json'])
  assert.equal(result.status, 0)

  let report
  assert.doesNotThrow(() => { report = JSON.parse(result.stdout) }, 'stdout must be valid JSON when --json is passed')

  assert.equal(report.contract, 'wdk-capability-audit-report/1')
  assert.deepEqual(validateReport(report), [])
  assert.ok(report.packages.length > 0)
})

test('CLI without --json: prints a human-readable table and exits 0', () => {
  const result = run(['--dir', join(FIXTURES, 'populated')])
  assert.equal(result.status, 0)
  assert.ok(result.stdout.includes('PACKAGE'))
  assert.ok(result.stdout.includes('@tetherto/wdk-wallet-evm'))
  assert.ok(result.stdout.includes('package(s) scanned'))
})

test('CLI: an unrecognized argument is an error, not a silent no-op', () => {
  const result = run(['--not-a-real-flag'])
  assert.notEqual(result.status, 0)
  assert.ok(result.stderr.includes('unrecognized argument'))
})

test('CLI: --help exits 0 and prints usage', () => {
  const result = run(['--help'])
  assert.equal(result.status, 0)
  assert.ok(result.stdout.includes('Usage:'))
})

test('CLI --faucets: prints a table and exits 0, without touching node_modules at all', () => {
  const result = run(['--faucets', '--dir', join(FIXTURES, 'no-node-modules')])
  assert.equal(result.status, 0, '--faucets must not require any @tetherto packages, or even a --dir, to work')
  assert.ok(result.stdout.includes('CHAIN'))
  assert.ok(result.stdout.includes('evm:11155111'))
  assert.ok(result.stdout.includes('No faucet listed on purpose'))
  assert.ok(result.stdout.includes('bitcoin:testnet3'))
})

test('CLI --faucets --json: emits valid JSON with faucets and noFaucetByDesign', () => {
  const result = run(['--faucets', '--json'])
  assert.equal(result.status, 0)
  let body
  assert.doesNotThrow(() => { body = JSON.parse(result.stdout) })
  assert.ok(Array.isArray(body.faucets))
  assert.ok(body.faucets.length > 0)
  assert.ok(Array.isArray(body.noFaucetByDesign))
  assert.equal(typeof body.faucetRegistryVersion, 'string')
})
