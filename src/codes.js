// The closed vocabularies this package emits, and nothing else. A report's
// `status` and `classification` fields are always drawn from these lists —
// never an ad-hoc string — so a reader parsing the JSON output and a reader
// reading this file always agree on what a value can mean.

/** The report format this package produces. Bump the trailing integer, never the name, on a breaking shape change. */
export const REPORT_CONTRACT = 'wdk-capability-audit-report/1'

/**
 * What `inspectModule()` found when it looked at one discovered package.
 * - `inspected`           — package.json parsed, and its `wdk.chains` field (the assumed convention — see README "Status") was a plain object. Zero chains is still `inspected`.
 * - `unrecognized-shape`  — package.json parsed, but no `wdk.chains` object was present. This is the *refusal* case: never guessed at, never crashed.
 * - `unreadable`          — package.json itself could not be read or parsed as JSON.
 */
export const INSPECTION_STATUSES = Object.freeze(['inspected', 'unrecognized-shape', 'unreadable'])

/**
 * What a discovered chain classifies as, against `src/registry.js`'s
 * hand-maintained table of chain identifiers this package is confident are
 * real. `unknown` is not a failure — it is the correct answer for any chain
 * identifier not in the registry, and the only answer this package will ever
 * give for one. Guessing is not a fallback path here; it does not exist.
 */
export const CLASSIFICATIONS = Object.freeze(['mainnet', 'testnet', 'unknown'])
