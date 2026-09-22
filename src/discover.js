// Finds installed @tetherto/wdk-* packages under a directory's node_modules.
// Reads package.json only — nothing here ever requires, imports, or
// evaluates a byte of the package's own code.
'use strict'

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * @typedef {object} DiscoveredPackage
 * @property {string} name - The package's own declared name (falls back to its directory name if package.json has none or can't be read).
 * @property {string|null} version - The package's declared version, or null if it could not be read.
 * @property {string} dir - Absolute path to the package's directory.
 * @property {boolean} readable - Whether package.json parsed as JSON.
 */

/**
 * Scan `<baseDir>/node_modules/@tetherto` for every directory whose name
 * starts with `wdk-`. This matches the task's stated pattern exactly: the
 * umbrella `@tetherto/wdk` package (name exactly `wdk`, no suffix) is *not*
 * included by design — only `@tetherto/wdk-<something>` is. See README
 * "Status" for why that boundary is drawn there rather than widened.
 *
 * A missing `node_modules` or a missing `@tetherto` scope is not an error —
 * it returns an empty array, same as a scope with nothing matching in it.
 * The caller (the CLI) is responsible for treating "found nothing" as a
 * refusal rather than a clean report; this function only reports what it saw.
 *
 * @param {string} [baseDir] - Directory to scan. Defaults to process.cwd().
 * @returns {DiscoveredPackage[]} Sorted by package name.
 */
export function discoverWdkPackages(baseDir = process.cwd()) {
  const scopeDir = join(baseDir, 'node_modules', '@tetherto')

  let entries
  try {
    entries = readdirSync(scopeDir, { withFileTypes: true })
  } catch (err) {
    if (err && (err.code === 'ENOENT' || err.code === 'ENOTDIR')) return []
    throw err
  }

  const found = []
  for (const entry of entries) {
    if (!entry.isDirectory() && !entry.isSymbolicLink()) continue
    if (!entry.name.startsWith('wdk-')) continue

    const dir = join(scopeDir, entry.name)
    const pkgJsonPath = join(dir, 'package.json')
    const fallbackName = `@tetherto/${entry.name}`

    let pkg
    try {
      pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8'))
    } catch {
      found.push({ name: fallbackName, version: null, dir, readable: false })
      continue
    }

    if (pkg === null || typeof pkg !== 'object' || Array.isArray(pkg)) {
      found.push({ name: fallbackName, version: null, dir, readable: false })
      continue
    }

    found.push({
      name: typeof pkg.name === 'string' && pkg.name ? pkg.name : fallbackName,
      version: typeof pkg.version === 'string' && pkg.version ? pkg.version : null,
      dir,
      readable: true,
    })
  }

  return found.sort((a, b) => a.name.localeCompare(b.name))
}
