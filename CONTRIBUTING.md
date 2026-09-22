# Contributing

Thank you for looking. This package is small on purpose — most of what you need to know is enforced by tests rather than described here.

## Getting set up

```bash
npm install
npm test          # node's built-in test runner
npm run check     # confirms the generated manifest is current
```

No build step, no external services, no network access needed to develop or test this package. Tests run entirely against fixtures in `test/fixtures/` — nothing here depends on a real `@tetherto/wdk-*` package being installed.

## Before you open a pull request

- **`npm test` must pass.** Every exported function needs direct coverage — see `test/inspect.test.mjs` and `test/registry.test.mjs` for the shape the existing suite takes.
- **A new registry entry needs a source.** `src/registry.js`'s header comment names where each existing entry's identifier comes from. A pull request adding a chain should do the same — a chain id added without a citable, public source will be asked to include one before it's merged. If you are not confident an identifier is correct, open an issue instead of a pull request; "leave it out" is the correct default here, not a failure.
- **If you can confirm the real `@tetherto/wdk-*` chain-configuration shape, that is the single most valuable contribution this package could receive.** See README "Status" for exactly what is unverified and `ARCHITECTURE.md`'s note on why `inspectModule()` is the one function that would need to change.
- **`summary` stays derived.** Don't add a code path that lets `buildReport()` accept a caller-supplied `summary` — see `ARCHITECTURE.md` for why that boundary exists.
- **No dependency, runtime or dev, beyond `typescript`.** This package ships zero runtime dependencies, same as its siblings; a change that needs one should be raised as an issue first.

## Reporting a bug

Open an issue with: the directory structure (or a trimmed `package.json`) that produced the wrong result, what `inspectModule()` or `classifyChain()` returned, and what you expected. Because every exported function here is pure, most bug reports are reproducible as a single test case — include one if you can; it becomes the regression test.

## Security issues

Not here. See [`SECURITY.md`](SECURITY.md) — **security@flashy.network**, never a public issue.

## License

By contributing, you agree your contribution is licensed under this project's [Apache-2.0 license](LICENSE).
