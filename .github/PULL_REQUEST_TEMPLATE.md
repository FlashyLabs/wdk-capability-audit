## What this changes

<!-- One or two sentences. If this touches inspectModule()'s shape assumption or the chain registry, say exactly which. -->

## Why

<!-- The real scenario this was written against, not just "improves X." -->

## Checklist

- [ ] `npm test` passes (`node --test`, no external services)
- [ ] `npm run check` passes (generated manifest is current — run `node src/manifest.js --write` if not)
- [ ] A new registry entry cites a public source (see `CONTRIBUTING.md`)
- [ ] `summary` is still computed only inside `buildReport()` / `deriveSummary()` — no new way to pass one in
- [ ] README / `ARCHITECTURE.md` updated if this changes documented behaviour
