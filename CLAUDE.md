# @flashylabs/wdk-capability-audit

A read-only capability audit for wallets built on Tether's WDK. It scans a
project's `node_modules` for every installed `@tetherto/wdk-*` package, reads
what each declares about the chains it supports, and classifies each chain as
**mainnet**, **testnet**, or **unknown** against a small hand-maintained
registry — never a guess. Published on npm at `0.1.0`. Apache-2.0 (holder
Flashy Labs); the estate register in flashyos `tools/estate-licences.mjs` is the
authority.

## ⚠️ Known limitation — the central assumption is unverified

**The chain-declaration convention is unverified against a shipping
`@tetherto/wdk-*` release.** `inspectModule()` (`src/inspect.js`) looks for a
package's chains at `wdk.chains` inside its own `package.json`. That convention
has **not** been observed in any real, published `@tetherto/wdk-*` package: six
real WDK packages were inspected on the development machine — `@tetherto/wdk`
(`1.0.0-beta.18`), `wdk-wallet` (`1.0.0-beta.19`), `wdk-wallet-evm`
(`1.0.0-beta.19`), `wdk-wallet-evm-erc-4337` (`1.0.0-beta.20`), `wdk-wallet-tron`
(`1.0.0-beta.13`), `wdk-failover-provider` (`1.0.0-beta.2`) — and **none
declares `wdk.chains`**, or any static chain configuration, in `package.json`.
Those packages take chain configuration from the integrating application at
runtime (`wdk.registerWallet('evm', WalletManagerEvm, { chainId, provider })`),
not as statically-readable data.

**The practical consequence: against today's real `@tetherto/wdk-*` packages
this tool returns `unrecognized-shape` / **0 chains** for every one of them.**
That is the tool refusing to guess, by design — not a clean bill of health. A
`0 chains` / `unrecognized-shape` result means "this tool could not recognize
the shape and said so", never "no testnet exposure".

Confirming the real convention needs a real, external, shipping WDK release,
which was not available when this was built — so the convention is stated as an
assumption, not a fact, and the refusal is the behaviour under test
(`test/inspect.test.mjs`, `test/audit.test.mjs`, `test/known-limitation.test.mjs`).
Do **not** widen the heuristic to guess a chain list from anything else in a
package (README, keywords, exports map): an assumption that silently widens is
an assumption that silently lies. The day a real WDK release confirms a
chain-declaration convention, `inspectModule()` is the one place to change (see
`CONTRIBUTING.md`), and this note plus the pinned README limitation are what
gets updated with it.

## Layout

| Path | What it is |
|---|---|
| `src/discover.js` | Finds `node_modules/@tetherto/wdk-*` — reads `package.json` only, never imports package code |
| `src/inspect.js` | Reads one package's declared chains at the assumed `wdk.chains` shape; returns `inspected` / `unrecognized-shape` / `unreadable`, never throws, never guesses |
| `src/registry.js` | The hand-maintained chain registry; `classifyChain()` returns `mainnet`/`testnet`/`unknown` (`unknown` for anything unlisted, always) |
| `src/faucets.js` | Hand-maintained testnet faucet list; the code never fetches or verifies a URL |
| `src/report.js` | `buildReport()` (summary always derived, never accepted) and `validateReport()` against `schema/report.schema.json` |
| `src/audit.js` | `auditDirectory()` — the full discover → inspect → classify → build pipeline the CLI calls |
| `bin/` | The `wdk-capability-audit` CLI |
| `schema/` | `report.schema.json`, contract `wdk-capability-audit-report/1` |
| `test/` | `node --test` suite; hermetic fixtures under `test/fixtures/` |

## Commands

```bash
npm test          # node's built-in runner — no network, no external services
npm run check     # confirm the generated manifest is current
npm run test:types # build .d.ts from JSDoc and type-check the consumer test
```

The `test` script names every test file rather than globbing (`cmd.exe` will
not expand a glob); `test/test-script.test.mjs` fails if a file on disk is not
named in the script, so a new test file must be added to `package.json`'s
`test` script.

## Rules — each enforced by a test

- **This package reads; it never writes**, and never imports or evaluates a
  scanned package's JS — only its `package.json`, as JSON. Scanning an
  untrusted `node_modules` tree is safe by construction.
- **The registry only grows by verification.** A chain id absent from
  `src/registry.js` classifies `unknown`, permanently, until someone adds it
  with a documented source — never inferred from a package's own claim.
- **The summary is arithmetic, not an assertion.** `buildReport()` derives
  `summary` from `packages`; `validateReport()` re-derives it independently.
- **An empty result is not a clean one.** Zero installed `@tetherto/wdk-*`
  packages is a refusal (exit 1), never a `packages: []` report that reads like
  real coverage.
- **The unverified assumption is documented and pinned.** The Known-limitation
  note above and the one near the top of `README.md`, and the real-shaped
  fixture that classifies `unrecognized-shape`, are asserted by
  `test/known-limitation.test.mjs` so the honesty cannot be quietly dropped.
- **The faucet list is checked-once, not live.** The code never fetches a
  faucet URL; `bitcoin:testnet3` is listed with no faucet by design.

## House rules — this repository is part of the Gord & Flashy estate

`main` is not necessarily the default branch elsewhere (ask
`git symbolic-ref --short refs/remotes/origin/HEAD`); say which branch you
measured; a generated file (`wdk-capability-audit.manifest.json`, `dist/`,
lockfiles) is regenerated, never hand-edited; no secret in any file; the
licence is declared once, in flashyos `tools/estate-licences.mjs`; report what
happened, including when it is worse than expected.
