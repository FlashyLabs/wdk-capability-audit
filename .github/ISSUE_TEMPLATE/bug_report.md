---
name: Bug report
about: Something in wdk-capability-audit doesn't do what it says
title: ''
labels: bug
assignees: ''
---

**What happened**

A clear description of what you expected `auditDirectory()` (or the CLI) to report, and what it actually reported.

**Minimal reproduction**

```js
import { auditDirectory } from '@flashylabs/wdk-capability-audit'

const report = auditDirectory('/path/to/project')
console.log(report)
// expected: ...
// actual: ...
```

If you can, include the `package.json` of the `@tetherto/wdk-*` package that produced the wrong result (trimmed to the relevant fields). The smaller this is, the faster it gets fixed.

**Package version**

Output of `npm ls @flashylabs/wdk-capability-audit`.

**Environment**

Node version (`node -v`), and whether you're calling `auditDirectory()` directly or through the CLI.
