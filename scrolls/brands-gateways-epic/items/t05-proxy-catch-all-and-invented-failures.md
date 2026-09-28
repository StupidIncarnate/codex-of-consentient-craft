# T05: No catch-all proxy defaults; no invented failures

| | |
|---|---|
| Phase | Phase 5 — tests and mocking |
| Source | `scrolls/brands-types-tests-rules.md`, T4 (lines 1792-1830), T5 (1832-1853), rows 2271-2273, `enforce-proxy-patterns` message row (2378), testing-patterns rows 2376-2377 |
| Needs | G19 |
| Unblocks | T08 |
| Packages touched | `eslint-plugin` (three new rules), every package with a `.proxy.ts` file (fixing violations) |
| Checks to run | `lint,typecheck,unit,integration` |
| Split | one agent per new rule (three agents), then fixing agents of 2-4 proxy files each, split per package |
| Runs alone | no |

## Why

A proxy constructor that answers every unexpected call with a canned success (`calledWith([]).returns('')`)
hides a forgotten call from the I/O trap, because the call now counts as staged. 90 adapter proxies stage
a `calledWith([])` answer; 22 of those are honest (the function takes no arguments), but at least 44 put a
canned answer in the constructor for a function that takes arguments. Separately, a hand-made failure
(`new Error('ENOENT')` with no `code`) has the shape the author imagined, not the shape Node actually
produces — 179 of the adapter proxies take a generic `error`, "file not found" is built without Node's
`code` 193 times and with it only 70 times, and of the 92 implementations tested with a code-less error,
64 catch errors themselves and 58 of those catch everything — the only shape that passes such a test.

## Current state

Checked 2026-09-26: none of the three rules named below exist yet in `packages/eslint-plugin/src`
(confirmed by a directory walk for each name). `rule-enforce-proxy-patterns-broker.ts` exists at
`packages/eslint-plugin/src/brokers/rule/enforce-proxy-patterns/rule-enforce-proxy-patterns-broker.ts`
(its message text at the cited line was not independently re-read here; treat the exact wording as
"not checked" until the executing agent opens the file).

## Work

Build three rules. All apply inside the gateway's own proxies too, not just workspace-package proxies.

### 1. `ban-proxy-catch-all-defaults` (pre-edit)

Refuses a `calledWith` argument in a proxy constructor that is a function literal returning `true` with
no condition — a catch-all, whether written directly (`calledWith([() => true])`) or hidden behind a
helper (`calledWith([anyArg()])` where `anyArg` returns `() => true`). Syntax-only check.

```
// flagged — every unexpected read now "succeeds" with ''
export const fsReadFileProxy = () => {
  const mock = registerMock({ fn: readFileSync });
  mock.calledWith([]).returns('');
  return { … };
};

// left alone
registerMock({ fn: randomUUID }).calledWith([]).returns(uuid);                  // no arguments: [] is the only address
mock.calledWith([filePath]).returns(content);                                    // addressed
return { existsOnlyFor: ({ filePaths }) => mock.calledWith([isPath]).implement(…) };  // opt-in scenario
```

A helper built only to dodge this rule (`anyArg()` returning `() => true`) still gets past a pure syntax
check; the rule's message names the fix (stage each call by its arguments) so such a helper shows up in
review instead of passing silently. Closing that gap fully needs refusing every argument that is not a
literal, a variable, or a predicate built from a staged value — leave that for later, per the doc's own
open scope note.

### 2. `ban-proxy-empty-called-with` (ward only — needs the type checker)

Refuses a `calledWith([])` answer on a handle from `registerMock({ fn })` where `fn`'s declared signature
takes arguments. Needs the type checker to know `fn`'s signature (so `randomUUID`, which takes none,
passes), so this rule cannot run pre-edit.

### 3. `ban-invented-failures` (pre-edit)

Refuses a hand-made `Error` given to a mock's `rejects`, `throws`, or a throwing `implement`, in a proxy
or test file. Its message names the recorded-failure stub to use instead.

```
// flagged — as the value given to a mock's rejects / throws / a throwing implement
proxy.throws({ filePath, error: new Error('ENOENT') });
handle.calledWith([p]).throws(Object.assign(new Error('x'), { code: 'ENOENT' }));   // still hand-made

// left alone
fs.fileMissing({ path });                                   // a wrapper proxy's scenario, built on a recorded failure
handle.calledWith([p]).rejects(FileMissingErrorStub({ syscall: 'open', path: p }));   // a recorded failure, from #gateway/node/fs__promises/file-missing-error/file-missing-error.stub
orchestrator.questNotFound({ questId });                    // provider-owned scenario
expect(() => run()).toThrow(/^Quest not found$/u);          // asserting what the code under test throws
```

### 4. Drop the old exception in `enforce-proxy-patterns`

`rule-enforce-proxy-patterns-broker.ts`'s `adapterProxyMustSetupMocks` message currently reads: "This
sets up default mock behavior when proxy is created." Drop that sentence — only the check for a
`jest.mocked` proxy with no staging at all stays. A constructor-level `calledWith([])` catch-all is no
longer allowed "when a parent proxy builds this adapter without describing any call of its own"; a
function that takes arguments never gets a constructor default, full stop.

### 5. Fix every violation, split per package

Once the three rules are built and scanned (not yet turned on for real code), fix violations in agents of
2-4 proxy files each, split per package. Each fix either:
- addresses the call by its real arguments instead of a catch-all `[]`, or
- replaces a hand-made `Error` with the matching recorded-failure stub or wrapper-proxy scenario.

## Lint rules this item adds or changes

| Rule | Refuses | Needs | Pre-edit? |
|---|---|---|---|
| `ban-proxy-catch-all-defaults` | A `calledWith` argument that is a function literal returning `true` with no condition | Syntax | Yes |
| `ban-proxy-empty-called-with` | A `calledWith([])` on a handle from `registerMock({ fn })` where `fn` takes arguments | Syntax for the empty array, the type checker for `fn`'s signature | No — ward only |
| `ban-invented-failures` | A hand-made `Error` given to a mock's `rejects`, `throws`, or a throwing `implement`, in a proxy or test file | Syntax | Yes |

Tag `ban-proxy-catch-all-defaults` and `ban-invented-failures` `'pre-edit'` in
`packages/shared/src/statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics.ts`.
`ban-proxy-empty-called-with` gets no `'pre-edit'` tag.

## Teaching text this item changes

Per rows 2376-2378: `mcp/src/brokers/architecture/testing-patterns/architecture-testing-patterns-broker.ts:297`
drops its "allowed when a parent proxy builds this adapter without describing any call of its own"
exception, and its line-38 example (`handle.calledWith([]).resolves(FileContentsStub({value: 'content'}))`)
becomes `handle.calledWith([filePath]).resolves('content')`. Hand these specific line-level rewrites to
Z03, which owns `get-testing-patterns` text, so the wording lands once, not once per item.

## Done when

- All three rules exist, are scanned over the whole repo, hand-checked on a sample, then turned on.
- `enforce-proxy-patterns`'s `adapterProxyMustSetupMocks` message no longer describes a default-behavior
  exception.
- Every proxy the rules flag is fixed: addressed calls replace catch-alls, recorded failures replace
  hand-made errors.
- `npm run ward -- --uncommitted` exits 0 on every touched file.

## Traps

- Fixing a catch-all default can silently change a test's outcome from "passes because everything is
  staged" to "the trap fires because nothing was staged for this specific call" — read what test actually
  needs the call before just adding an address; do not just widen the address until it passes.
- A recorded-failure stub does not exist for every kind of hand-made error yet — some of these fixes may
  need a new stub built first, which is G16/G18's job in the gateway (a Phase 1 item), not this item's. If
  a fix needs a stub that does not exist, report it under LEFT STANDING rather than inventing one inline.
- Do this per package, in small batches — the CLAUDE.md dispatch rule caps cleanup agents at 1-3 files;
  this item's own split note allows up to 4 for migration-shaped work, but stay on the low end when a
  proxy file is large.

## Concessions made while executing

<Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table.>

## Plan — T05 ward

Scanned `packages/ward/**/*.ts` with all three rules on, through a temporary config
(`tmp/t05-ward.config.js`, extends `eslint.config.js`) driven by the ESLint Node API
(`tmp/t05-scan.js`; bare `npx eslint` is hook-blocked). One violation, before any edit:

- `packages/ward/src/brokers/command/run/multi-package-layer-broker.proxy.ts:77`
  `ban-proxy-empty-called-with` — `configResolveHandle.calledWith([])` on `configResolveBroker`,
  which takes `{ filePath }`.

`ban-proxy-catch-all-defaults` and `ban-invented-failures` flag nothing in ward. Fix: the proxy
stages the default config per rootPath, addressed by the exact `{ filePath }`, from the shared
`resolveWardBin` step every setup method already calls; the one test that calls
`setupWardConcurrency` now calls it after `setupSpawnAndLoad`, since the later staging wins.
Rescanned after the edit: 0 violations across the three rules.
