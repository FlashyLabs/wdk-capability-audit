# Security

## Threat model

This package holds no key, signs nothing, and makes no network call. Its job is to read local `package.json` files under a directory you point it at and classify what it finds against a fixed, versioned registry. Its security surface is therefore narrow and specific:

- **It must never execute code from the tree it scans.** `discoverWdkPackages()` and `inspectModule()` read `package.json` with `JSON.parse` only — never `require()`, never `import()`, never `eval`. A `node_modules` tree handed to this tool is treated as untrusted data, not as code to run. This is the property every test in `test/discover.test.mjs` and `test/inspect.test.mjs` that uses a malformed-JSON fixture exists to protect: a broken or hostile `package.json` should produce `status: "unreadable"`, never a crash and never a code path that touches the file's contents as anything but a string to parse.
- **A misclassification is the failure that matters.** A chain reported `unknown` when it is actually a well-known mainnet is an availability annoyance — a human has to look it up themselves. A chain reported `mainnet` or `testnet` when the registry entry is wrong is the dangerous direction, because a report is exactly the kind of document a team might trust without re-checking. `src/registry.js`'s discipline (documented sources, no entry added on a guess) exists for this reason.

This package assumes the directory you point it at is one you already trust enough to have run `npm install` in. It does not sandbox or otherwise protect against a genuinely malicious `node_modules` tree beyond the "never execute" boundary above — that boundary is the actual guarantee, not an incidental one.

## Known, deliberate limitations

- **The chain-inspection convention is unverified against a real `@tetherto/wdk-*` package** — see README "Status." A false negative (`unrecognized-shape` for a package that does, in some other form, declare its chains) is the expected behavior today, not a bug.
- **The chain registry is short by design.** A chain not in `src/registry.js` classifies `unknown` — this package will never silently expand its confidence to cover a chain nobody has verified.
- **This package does not attempt to determine whether a *given wallet instance* is actually configured for a mainnet or testnet chain at runtime.** It reads what a package *declares* about the chains it supports (once a real convention for that exists — see "Status"), not what an application has configured a running wallet to use. Those are different questions; conflating them is exactly the kind of guess this tool refuses to make.

## Reporting a vulnerability

Please report suspected vulnerabilities privately rather than as a public GitHub issue: email **security@flashy.network** with a description and, if possible, a minimal reproduction. We aim to acknowledge within 3 business days.

Do not include real credentials, private keys, or production data in a report — this package never needs them to reproduce an issue, since every input it takes is a directory path and the `package.json` files under it.
