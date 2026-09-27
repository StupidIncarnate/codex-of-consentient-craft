# T06: A proxy composes the proxy beside each wrapper it calls

| | |
|---|---|
| Phase | Phase 5 — tests and mocking |
| Source | `scrolls/brands-types-tests-rules.md`, T1 (lines 1680-1716), T3's machine-check paragraph (line 1790), row 2234 |
| Needs | B03 |
| Unblocks | none named |
| Packages touched | `eslint-plugin` (`enforce-proxy-child-creation` rule change) |
| Checks to run | `lint,typecheck,unit,integration` |
| Split | one agent |
| Runs alone | no |

## Why

The proxy of the file that makes a call is the one place that knows which call a test needs. A wrapper's
proxy carries the scenarios for its own handling; a caller that composes it tests against the wrapper's
real behaviour instead of re-staging the outside module by hand. Under EPIC.md concession 1, every stub
and proxy is imported from its own file, never a `_test_` barrel, so this rule's "find the `.proxy` file
beside the export" check constructs that sibling file's path directly, rather than resolving through any
barrel.

## Current state

- `rule-enforce-proxy-child-creation-broker.ts` already exists at
  `packages/eslint-plugin/src/brokers/rule/enforce-proxy-child-creation/rule-enforce-proxy-child-creation-broker.ts`,
  confirmed present. Its current behaviour (asking for `<export>Proxy` for a relative import, and for a
  `#gateway` import only when a `.proxy` file sits beside that export) was not re-read line-by-line in
  this pass — treat the doc's description of "today" as accurate pending the executing agent's own read
  of the file.
- The rule's own test, `rule-enforce-proxy-child-creation-broker.test.ts`, exists alongside it.

## Work

1. **Read the rule's current implementation** to confirm how it locates a `.proxy` file today (by
   relative path, or by resolving through the gateway's `exports` map).

2. **Change the rule so it looks for the `.proxy` file beside the imported export, in the gateway and in
   workspace packages alike** — under concession 1, every stub and proxy is imported from its own file, so
   this check constructs that file's specifier directly and confirms it exists, rather than resolving
   through any barrel. A caller importing
   `#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists` should have its proxy requirement
   resolved by checking whether `#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy`
   (the same path with `.proxy` appended) exists on disk. The same holds for a workspace package:
   `@dungeonmaster/orchestrator/startup/start-orchestrator` checks for
   `@dungeonmaster/orchestrator/startup/start-orchestrator.proxy`.

3. **Also refuse a `registerMock({ fn })` of a gateway wrapper in any proxy file outside the gateway
   itself.** This is the second half of T3's rule: the wrapper's own proxy is the only place allowed to
   mock the wrapper's underlying outside call directly; a caller's proxy may only compose the wrapper's
   proxy, never re-stage the outside function itself.

```
// before — the broker called a pass-through adapter, so the broker's proxy composed the adapter's proxy
// brokers/quest/archive/quest-archive-broker.proxy.ts
const rename = fsRenameAdapterProxy();
rename.succeeds({ from, to });

// after — the broker calls the gateway's rename, so its proxy composes the gateway's renameProxy
import { renameProxy } from '#gateway/node/fs__promises/rename/rename.proxy';
const rename = renameProxy();
rename.renames({ from, to });
```

```
// left alone
packages/@gateway/node/src/fs__promises/rename/rename.proxy.ts:   registerMock({ fn: rename })   // from 'fs/promises': the wrapper calls it
brokers/quest/archive/…-broker.proxy.ts:                  renameProxy()                  // the broker calls the wrapper
```

Note the import line above reads `#gateway/node/fs__promises/rename/rename.proxy`, the per-file form
concession 1 requires — this matches the source doc's own example at line 1691 directly. Do not resolve a
proxy through any `_test_` barrel.

## Lint rules this item adds or changes

| Rule | Change | Pre-edit? |
|---|---|---|
| `enforce-proxy-child-creation` | Looks for the `.proxy` file beside the imported export by constructing its per-file path directly, in the gateway and in workspace packages alike (not just the gateway worktree special case it has today); also refuses a `registerMock({ fn })` of a gateway wrapper in a proxy outside the gateway | No — as today, `'post-edit'`: it checks whether the sibling `.proxy` file exists on disk |

## Teaching text this item changes

None named for this specific item beyond what T01-T05/T09 already cover for testing-patterns text.

## Done when

- `enforce-proxy-child-creation` resolves a wrapper's proxy by its own per-file path, for both gateway and
  workspace-package imports.
- The rule refuses a `registerMock({ fn })` of a gateway wrapper in any proxy file outside the gateway.
- `npm run ward -- --uncommitted` exits 0 on every touched file.

## Traps

- This item needs B03 done first — B03 is what moves every workspace package's own stubs and proxies onto
  the per-file `exports` form (the gateway's own equivalent, G26, already landed by this point); building
  this rule change before B03 lands means workspace packages have no per-file proxy path to resolve yet,
  and every test for the new rule behaviour would need fixtures pretending B03 already happened.
- Do not resolve a wrapper's proxy through a barrel — concession 1 means every proxy and stub is imported
  from its own file, so the source doc's own literal import path is now the correct one to use as-is.

## Concessions made while executing

<Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table.>
