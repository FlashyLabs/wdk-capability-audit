# Architecture

## Pipeline

```
discoverWdkPackages(dir)  ->  inspectModule(pkg) for each  ->  buildReport({dir, packages})
     src/discover.js            src/inspect.js                    src/report.js
```

`auditDirectory()` (`src/audit.js`) wires these three together and is what both the CLI and any library consumer should call — the three stages are exported separately mainly so each is independently unit-testable, not because a caller is expected to recompose them.

## Why nothing here executes package code

`discoverWdkPackages()` and `inspectModule()` both read exactly one file per package: its `package.json`, parsed with `JSON.parse`. Neither ever calls `require()` or `import()` on anything inside a scanned `node_modules` tree. This is a deliberate, load-bearing boundary, not an oversight: a tool whose entire purpose is to be run against a directory somebody else populated (a `node_modules` tree, built from a `package-lock.json` somebody else wrote) must not be a code-execution vector. The cost of that boundary is real — it is *why* the chain-inspection convention (see README "Status") has to be a declared, static field in `package.json` rather than something read off a package's actual runtime exports, which would require importing the package to observe. That tradeoff is intentional.

## Why the assumed shape lives in `package.json` and not somewhere else

Three places could plausibly hold a "what chains does this package support" answer: the package's runtime exports (requires execution — ruled out above), a separate convention file this tool would have to invent a name for, or a field inside `package.json` itself, which every npm package already ships and this tool already reads for `name`/`version`. The third was chosen because it needs no new file convention and composes with the read this tool already does. It is still unverified against reality — see README "Status" — and if a real convention turns out to live somewhere else, `inspectModule()` is the only function that needs to change; `discover.js`, `report.js`, and the schema are unaffected.

## Why `summary` cannot be supplied by a caller

`buildReport({dir, packages, now})` takes no `summary` parameter — there is no argument name a caller could pass that this function reads. `deriveSummary(packages)` is the only code path that produces one, and it is called unconditionally inside `buildReport()`. `validateReport()` then re-derives the same summary from a report's `packages` array and compares, so even a report assembled by hand (read from disk, built in a test, round-tripped through some other system) is caught if its `summary` and `packages` disagree. This mirrors the flashyos house rule that a derived field must never be independently assertable — refused by name in both the writer and the validator, not just the writer.

## Why `unreadable` is a distinct status from `unrecognized-shape`

A package whose `package.json` cannot be parsed and a package whose `package.json` parses fine but declares no `wdk.chains` are different facts, and conflating them would hide the first one inside the second. `unreadable` means "we could not read this package's own metadata at all" — worth investigating on its own, independent of whether the chain-shape assumption in this tool is even the right one.

## Why the CLI's vacuity guard is not inside `auditDirectory()`

`auditDirectory()` always returns a report, even an empty one — a library caller composing this tool into something larger may have a legitimate reason to want that. The refusal ("found no `@tetherto/wdk-*` packages," non-zero exit) is the CLI's decision, made at the one place a human actually reads a printed claim (`bin/wdk-capability-audit.js`), not baked into the library function every caller has to go around.
