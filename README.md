# @flashylabs/wdk-capability-audit

```
        ██
       ██
      ██████
        ██
       ██
      ██
```

A capability audit for wallets built on [Tether's WDK](https://github.com/tetherto/wdk). It scans a project's `node_modules` for every installed `@tetherto/wdk-*` package, reads what each one declares about the chains it supports, and classifies each chain as **mainnet**, **testnet**, or **unknown** — against a small, hand-maintained registry, never a guess.

[![tests](https://github.com/FlashyLabs/wdk-capability-audit/actions/workflows/ci.yml/badge.svg)](https://github.com/FlashyLabs/wdk-capability-audit/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org)

Built by [Flashy Labs](https://flashyos.com) — part of the open-source toolkit we ship for teams building on Tether's WDK. Its siblings are [`@flashylabs/wdk-policy-guard`](https://github.com/FlashyLabs/wdk-policy-guard) and [`@flashylabs/wdk-staking-kit`](https://github.com/FlashyLabs/wdk-staking-kit).

## Why this exists

Before a team commits to a chain in production, somebody has to answer a boring but load-bearing question: *which of the WDK modules we have installed actually point at mainnet, and which are still wired to a testnet we forgot to swap out?* That question gets answered by hand today — open each `@tetherto/wdk-*` package, find its chain configuration, cross-reference the chain id against what you remember mainnet and testnet to be. It is exactly the kind of check that is easy to get right once and easy to get wrong silently the second time, six months later, after a dependency bump nobody re-reviewed.

This package turns that manual check into something that runs the same way every time and refuses rather than guesses when it isn't sure — see "Status" below for the one place that discipline currently bites: the assumption this tool makes about how a package declares its chains has not yet been confirmed against a real `@tetherto/wdk-*` release.

## Install

```bash
npm install --save-dev @flashylabs/wdk-capability-audit
```

## Quickstart

```bash
npx wdk-capability-audit                 # human-readable table, scans ./node_modules
npx wdk-capability-audit --dir ../app    # scan a different project
npx wdk-capability-audit --json          # the full wdk-capability-audit-report/1 report, on stdout
```

Or use it as a library:

```js
import { auditDirectory, validateReport } from '@flashylabs/wdk-capability-audit'

const report = auditDirectory('/path/to/project')
console.log(report.summary)
// { packagesScanned: 3, packagesInspected: 0, packagesUnrecognizedShape: 3,
//   packagesUnreadable: 0, chainsTotal: 0,
//   chainsByClassification: { mainnet: 0, testnet: 0, unknown: 0 } }

console.log(validateReport(report)) // [] — this report conforms to schema/report.schema.json
```

## What it produces

The primary product is the JSON report, not the table — `--json` emits a document conforming to [`schema/report.schema.json`](schema/report.schema.json) (JSON Schema, draft 2020-12), contract `wdk-capability-audit-report/1`:

```json
{
  "contract": "wdk-capability-audit-report/1",
  "tool": { "name": "@flashylabs/wdk-capability-audit", "version": "0.1.0" },
  "generatedAt": "2026-09-22T12:00:00.000Z",
  "dir": "/path/to/project",
  "packages": [
    {
      "name": "@tetherto/wdk-wallet-evm",
      "version": "1.0.0-beta.19",
      "status": "unrecognized-shape",
      "chains": []
    }
  ],
  "summary": {
    "packagesScanned": 1,
    "packagesInspected": 0,
    "packagesUnrecognizedShape": 1,
    "packagesUnreadable": 0,
    "chainsTotal": 0,
    "chainsByClassification": { "mainnet": 0, "testnet": 0, "unknown": 0 }
  }
}
```

`summary` is computed from `packages` by `buildReport()` — there is no call shape through which a caller can pass in a `summary` that disagrees with the array beside it. `validateReport(report)` re-derives it independently and returns a list of problems (empty means valid) for any report that reaches your code some other way.

## API

| Export | What it does |
|---|---|
| `discoverWdkPackages(dir?)` | Reads `<dir>/node_modules/@tetherto/wdk-*` and returns `{name, version, dir, readable}` for each. Reads `package.json` only — never requires or imports a package's code. |
| `inspectModule(pkg)` | Reads one discovered package's `package.json` for its declared chains (see "Status" for the assumed shape). Returns `{status, chains}`, `status` one of `inspected` / `unrecognized-shape` / `unreadable`. Never throws, never guesses. |
| `classifyChain(namespace, id)` | Looks up `{namespace, id}` in the hand-maintained registry. Returns `'mainnet'`, `'testnet'`, or `'unknown'` — `'unknown'` for anything not listed, always. |
| `listRegisteredChains()` | Every chain this version's registry recognizes, as `{namespace, id, classification}`. |
| `buildReport({dir, packages, now?})` | Assembles a `wdk-capability-audit-report/1` report, with `summary` always derived, never accepted as input. |
| `deriveSummary(packages)` | The summary a given `packages` array implies — what `validateReport()` checks a report's own `summary` against. |
| `validateReport(report)` | Validates a report against `schema/report.schema.json` plus the summary-derivation rule. Returns an array of problems; empty means valid. |
| `auditDirectory(dir?, now?)` | The full pipeline: discover, inspect, classify, build. What the CLI calls. |
| `REPORT_CONTRACT`, `INSPECTION_STATUSES`, `CLASSIFICATIONS` | The closed vocabularies every report's `contract`, `status`, and `classification` fields are drawn from. |

Full TypeScript declarations ship with the package, generated from the source's own JSDoc so the types can never drift from the implementation. `test-types/consumer.ts` is the type-level test that would fail if they ever did.

## What this does not do

- It does not modify any file or package it scans.
- It does not execute or import untrusted code — it only reads `package.json` and the package's declared exports.
- It does not guess at an unrecognized chain. It refuses.
- It does not replace a human's judgment about whether a given chain is safe to point production at.

## Design principles

- **This package reads; it never writes.** Discovery and inspection read only `package.json` files as JSON — never a package's own JavaScript, and never anything executed or imported — so scanning an untrusted `node_modules` tree is safe by construction.
- **The registry only grows by verification, never by convenience.** A chain id absent from `src/registry.js` classifies `unknown`, permanently, until someone adds it with a documented source — never inferred from a package's own claim about itself.
- **The summary is arithmetic, not an assertion.** `summary` is computed from `packages` inside `buildReport()`, and `validateReport()` recomputes it independently — a report cannot claim a count its own array disagrees with.
- **An empty result is not a clean one.** Zero installed `@tetherto/wdk-*` packages is a refusal (`wdk-capability-audit: found no @tetherto/wdk-* packages`, exit code 1), never a report with `packages: []` that reads indistinguishably from real coverage.
- **An audit that cannot recognize what it is looking at must say so by name, because a shape mistaken for a fact is a fact nobody actually checked.**

## Status

Pre-1.0 (`0.1.0`). Read this section before trusting a report against anything that matters.

**The chain-inspection convention is an explicit, unverified assumption.** `inspectModule()` looks for a package's chains at `wdk.chains` inside its own `package.json` — a plain object keyed by a chain label, each entry shaped `{ "namespace": "evm", "id": 1 }`. **This convention has not been observed in a real, published `@tetherto/wdk-*` package.** While building this tool, six real packages were inspected directly on the development machine — `@tetherto/wdk` (`1.0.0-beta.18`), `wdk-wallet` (`1.0.0-beta.19`), `wdk-wallet-evm` (`1.0.0-beta.19`), `wdk-wallet-evm-erc-4337` (`1.0.0-beta.20`), `wdk-wallet-tron` (`1.0.0-beta.13`), and `wdk-failover-provider` (`1.0.0-beta.2`) — and **none of them declares a `wdk.chains` field, or any static chain/network configuration, in `package.json`.** Chain configuration in those packages is supplied by the *integrating application* at runtime — e.g. `wdk.registerWallet('evm', WalletManagerEvm, { chainId: 84532, provider })` — not published by the package itself as static, statically-readable data.

Given that gap, `inspectModule()` is designed to do the honest thing rather than the convenient one: every one of those six real packages inspects as `status: "unrecognized-shape"` today, and that refusal is itself the behavior under test (`test/inspect.test.mjs`, `test/audit.test.mjs`). This is this tool telling the truth about a real gap between an assumed convention and what currently ships, not a bug to be papered over. If a future WDK release adopts this convention (or a different one this tool should learn), `inspectModule()` is the one place that needs to change — see `CONTRIBUTING.md`.

**Discovery matches `@tetherto/wdk-*` exactly, as specified.** The umbrella `@tetherto/wdk` package (name exactly `wdk`, no suffix) is therefore never scanned by this tool, by design — only `@tetherto/wdk-<something>` packages are.

**The chain registry is intentionally short.** `src/registry.js` lists only the chain identifiers this package's authors are confident are correct without looking anything up: Ethereum mainnet and its current public testnets, four EVM L2 mainnet/testnet pairs, Tron's mainnet/Nile/Shasta, and Bitcoin's mainnet/testnet3. A production deployment on a chain not in that list will classify `unknown` — that is correct behavior, not a gap to silently work around by guessing.

## Testing

```bash
npm test          # node's built-in test runner, no external services, no network access
npm run check     # confirms the generated manifest is current
```

Tests are hermetic: `test/fixtures/` contains a synthetic `node_modules/@tetherto/...` tree (some packages shaped to match the assumed convention, some shaped like the real packages above, one with invalid JSON, one with an empty chain list) — nothing depends on anything actually being installed on the machine running CI.

## Security

This package never signs anything, holds a key, or makes a network call. Its entire job is reading local `package.json` files and classifying what it finds against a fixed, versioned table — see `SECURITY.md` for the full threat model and how to report a vulnerability.

## Provenance

Built to turn a manual, ad-hoc review step — "what chains do our installed WDK modules actually point at?" — into something repeatable, open-sourced because the question belongs to every team building on WDK, not just to us. See `CHANGELOG.md`.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## ⚡ The Strike

This README commits to a secret, the way `classifyChain()` commits to a verdict — fixed in the registry before you ask, checkable by anyone after:

```
sha256: c6d3f6a386b47dde5db720cd2fb3c7163488da27a5bf9f499ee2b88eeac1c7a8
```

The preimage is already on this page — one exact sentence from "Design principles," above. Recover it, hash it yourself (never trust, verify — that includes us), and open an issue titled `⚡ STRIKE` containing the sentence. First verified striker per release gets their name in [`STRIKERS.md`](STRIKERS.md).

No prize, no token. An audit tool has enough unverifiable claims in the world already; this one isn't going to add one about itself.

## License

[Apache-2.0](./LICENSE) © 2026 Flashy Labs

---

Built by [Flashy Labs](https://flashyos.com), the mesh platform for organisations' agents. If something here is broken, unclear, or just interesting, [open an issue](https://github.com/FlashyLabs/wdk-capability-audit/issues) — we read them.
