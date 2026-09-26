# Unit 10: fileScannerBroker's own glob copy → `glob` from `@dungeonmaster/npm/glob`

## Files changed

- `packages/mcp/src/brokers/file/scanner/file-scanner-broker.ts`
- `packages/mcp/src/brokers/file/scanner/file-scanner-broker.proxy.ts`
- `packages/mcp/src/brokers/file/scanner/file-scanner-broker.test.ts`

No adapter was deleted. `packages/mcp/src/adapters/glob/find/glob-find-adapter.ts` (+ `.proxy.ts`)
is untouched and still has a live caller: `packages/mcp/src/brokers/mcp/discover/mcp-discover-broker.ts`
calls it directly (twice, for the empty-result directory/grep hints), and
`packages/mcp/src/brokers/mcp/discover/mcp-discover-broker.proxy.ts` composes its adapter proxy
directly too. Not orphaned. `mcp/package.json` already listed `@dungeonmaster/node` and
`@dungeonmaster/npm` in `dependencies` (added by an earlier unit) — no edit needed; re-read the file
to confirm before starting.

## Gateway imports used

- `glob as globFind` from `@dungeonmaster/npm/glob` (aliased — the broker's own parameter is
  already named `glob`, the caller's search pattern; importing the gateway export under its own
  name would shadow it, turning every real call into an attempt to invoke a `GlobPattern` value.
  `typecheck` catches this (the shadowed identifier is not callable), pointing at the call site
  rather than the import — worth flagging for any caller whose own vocabulary collides with a
  gateway export's name, since it costs a typecheck failure and a moment of confusion, even though
  nothing ships broken).
- `globProxy` from `@dungeonmaster/npm/testing`, composed inside `file-scanner-broker.proxy.ts`.

## Verifying the "winning shape" claim line by line

Compared `packages/mcp/src/adapters/glob/find/glob-find-adapter.ts` against
`packages/npm/src/glob/glob.ts`:

| | mcp's `globFindAdapter` | gateway `glob` |
|---|---|---|
| `ignore` | required, `readonly GlobPattern[]` | required, `readonly string[]` — same shape |
| directories | `nodir: includeDirectories !== true` — excluded unless the caller opts in | `nodir: options.nodir ?? true` — excluded unless the caller opts out |
| `cwd` | required | optional |
| `pattern` | branded `GlobPattern`, `String(cwd)`-coerced separately | `string \| string[]`, used as-is |
| error handling | none — a glob rejection is a raw, unwrapped rejection | `try/catch`, rethrows `Error('glob failed for pattern ' + JSON.stringify(pattern) + ': ' + reason, {cause})` |
| return | `readonly PathSegment[]` (adapter parses each result) | `Promise<string[]>` (caller must brand) |

`fileScannerBroker` never passes `includeDirectories`, so both sides resolve to `nodir: true` either
way — **behaviour is identical** for this caller, confirming the "winning shape" claim: same
required ignore list, same directories-excluded-by-default policy. The two real differences are
(1) branding moves from the adapter into the broker (`.map((p) => pathSegmentContract.parse(p))`
now sits at each of the two call sites in the broker, since gateway wrappers "take and return plain
values ... never import zod contracts" per the brief), and (2) the try/catch, covered next.

## The new error path

`fileScannerBroker`'s two `glob(...)` calls (project scan, shared-package scan) were never wrapped
in a `try`/`catch` before, and still aren't — a rejection propagates straight out of the broker
either way. **What changes is the rejection's shape.** Before: whatever `glob` itself throws
(unwrapped). After: the gateway's own `Error('glob failed for pattern "<pattern>": <reason>',
{cause})`, naming the resolved absolute pattern. Added
`ERROR: {glob rejects} => broker rejects with the gateway wrapper error naming the pattern` in
`file-scanner-broker.test.ts`, staged via a new `setupGlobFailure` proxy method (`globGateway.throws(...)`),
asserting the exact wrapped message via an anchored regex. Ran it: **PASS**.

## A wrapper-mocking caller: what's odd

This is the first caller of a WRAPPED (non-pass-through) `@dungeonmaster/npm` export. Two things
worth flagging for whoever builds more of these:

1. **Naming and hoisting both work as designed.** `globProxy` (named `<exportName>Proxy`, per the
   brief's systemic fix) hoists correctly through `@dungeonmaster/npm/testing` — no repeat of the
   cross-package hoisting gap earlier units hit. `registerMock({ fn: glob })` inside
   `packages/npm/src/glob/glob.proxy.ts` mocks the RAW npm `glob` export (imported from `'glob'`,
   not from `./glob`), which is *why* it works: the gateway wrapper calls that same imported
   reference internally, so mocking the raw import intercepts every real invocation while still
   running the wrapper's own logic (nodir/ignore defaults, the try/catch) for real. That means a
   caller testing the NEW error path (like this unit's) exercises the gateway's own wrapping code
   for real, under test — a genuine improvement over an adapter that had no wrapping logic to prove.

2. **`globProxy` exposes only `returns`/`throws` — no catch-all, no introspection.** mcp's own
   `globFindAdapterProxy` (the file this unit replaces) auto-stages `handle.calledWith([]).resolves([])`
   in its constructor (a zero-arg, matches-anything default) AND exposes `getOptionsFor` (reads back
   the actual call args via `callsMatching`). `@dungeonmaster/npm/glob`'s `globProxy` has neither.
   Concretely, that means:
   - **Every distinct call the broker under test can make must be staged explicitly, or it throws.**
     `fileScannerBroker` makes a SECOND, unaddressed `glob` call for any broad (`**`-prefixed) glob —
     scanning `@dungeonmaster/shared` too — which the old adapter's catch-all silently answered
     `[]` for. The new proxy (`file-scanner-broker.proxy.ts`) has to compute and stage that second
     address itself (root = the real, unmocked `sharedPackageResolveAdapter()` result, same ignore
     list) in every `setupFiles`/`setupFilesAtRoot`/`setupFilesWithFailingReads` call, or those
     tests throw on the second scan instead of quietly returning empty.
   - **No way to inspect what a call was really made with.** The three `describe('ignore
     patterns', ...)` tests used to stage `proxy.setupFiles({ files: [], pattern })` (address-agnostic
     on `ignore`, since the old adapter's own address never included it) and then read back
     `proxy.getGlobOptionsFor({ pattern })` after the real call to assert the computed ignore list.
     `globProxy` bakes `ignore` into the EXACT staged address (`resolvedOptions` always includes it),
     so a call whose ignore list doesn't match the staged one falls through unmatched and throws —
     there is no partial-object or predicate escape through the gateway's public proxy surface.
     Rewrote those three tests to prove the same fact a different way: stage a SENTINEL file only
     under the exact, correctly-filtered ignore address (computed with the same
     `globIgnoreFilterTransformer` call the broker itself makes), then assert the broker's result
     IS that sentinel. If the broker computed the wrong ignore list, the real call falls through to
     no match and throws — the test fails loudly instead of silently reading back the wrong value.
     Arguably a stronger test (address-mismatch is an unconditional throw, not a passable weak
     assertion), but it is a genuinely different testing technique the trial should flag: reproducing
     the OLD introspection-based test suite verbatim was not possible through the gateway's testing
     surface as it stands.

## Ward command and result

```
npm run ward -- --only lint,typecheck,unit -- packages/mcp/src/brokers/file/scanner/file-scanner-broker.ts packages/mcp/src/brokers/file/scanner/file-scanner-broker.proxy.ts packages/mcp/src/brokers/file/scanner/file-scanner-broker.test.ts
```

```
lint:      PASS  1 packages (3 files passed/0 files failed, 3 discovered)  4.6s
typecheck: PASS  1 packages (549 files passed/0 files failed, 549 discovered)  4.7s
unit:      FAIL  1 packages (2 files passed/1 files failed, 187 discovered)  @dungeonmaster/mcp (9)  15.2s
```

Lint and typecheck are fully green (no `enforce-import-dependencies`-style misfire was hit — this
`brokers/` file importing `@dungeonmaster/npm/glob` did not trip anything; unlike the trial-plan's
prediction for units 4-6, this package's boundary rule apparently already tolerates it, or the rule
hasn't been taught to flag it either way — either way, nothing to report here). `file-scanner-broker.test.ts`
itself is fully green (all rewritten and new tests pass). The one unit failure is
`packages/mcp/src/brokers/mcp/discover/mcp-discover-broker.test.ts` — **9 errors, not in a file this
unit touched**, described next.

## A blocking cross-caller finding: mcp-discover-broker.test.ts breaks

`mcp-discover-broker.proxy.ts` (untouched, out of this unit's file list) composes
`fileScannerBrokerProxy()` directly (`const fileScannerProxy = fileScannerBrokerProxy();`), and its
`setupFileDiscovery`/etc. methods call `fileScannerProxy.setupFiles({ files, pattern })` with a
`pattern` built as `` `${process.cwd()}/**/*.ts` `` — the REAL, unmocked `process.cwd()`, not the
mocked `processCwdAdapter()` value (`'/default/cwd'`) `fileScannerBroker` actually scans from.

This was always a mismatch, but it was invisible before: the OLD `globFindAdapterProxy` matched a
staged call by a PREDICATE comparing only the substring from each side's first wildcard character
onward (`matchesGlobTail`), so the real (mocked-cwd) call and the staged (real-cwd) pattern always
matched on their shared `'**/*.ts'` tail regardless of what came before it. `@dungeonmaster/npm/glob`'s
`globProxy` stages an EXACT literal `pattern` string — there is no predicate address available
through its public API — so this caller's pre-existing prefix mismatch, previously invisible, now
surfaces as a hard miss: the real call falls through to no match, and (with no catch-all either)
throws, which the broker doesn't catch, so `mcpDiscoverBroker` returns whatever partial/empty state
it was already in — observed as 9 failing assertions, all reading back **empty results where a
sentinel file was expected**.

This is NOT fixable inside this unit's own files. Any general fix inside
`file-scanner-broker.proxy.ts` that tries to auto-recover the "true suffix" from an ambiguous
`pattern` argument (e.g. tail-extracting from the first wildcard, mirroring the retired predicate)
is unsound: it silently breaks THIS unit's own `'glob naming an ignored dir'` test instead, because
that test's `pattern` (`'tmp/**/*'`) has a MEANINGFUL literal segment (`tmp/`) immediately before its
own first wildcard — exactly what tail-extraction is built to discard. The two callers' conventions
for what `pattern` means (a bare glob suffix here vs. a real-cwd-prefixed absolute string in
`mcp-discover-broker.test.ts`) are mutually incompatible under the gateway's exact-match staging;
reconciling them means changing `mcp-discover-broker.proxy.ts`/`.test.ts`, both outside this unit's
assignment.

**Reported, not chased, per the brief's "stay in your lane" rule** — this needs either (a) a
follow-up unit switching `mcp-discover-broker`'s own glob usage to the gateway consistently (so both
proxies compute their staged pattern from the same mocked root, closing the gap that made the
mismatch possible), or (b) `@dungeonmaster/npm/glob`'s `globProxy` gaining a predicate/partial-match
address option before any more callers migrate onto it.

## Edge cases found the design did not already account for

- **The gateway `globProxy` has no zero-arg catch-all.** Any broker making more than one `glob` call
  per invocation (this one makes up to two — project root, then `@dungeonmaster/shared` for a broad
  glob) must have its OWN proxy stage every one explicitly, or an unstaged call throws instead of
  resolving empty. Documented above; handled inside this unit's own proxy.
- **The gateway `globProxy` bakes the full options object (`ignore` included) into the staged
  address, with no partial-match escape.** A caller whose ignore list is data-dependent (built by a
  transformer from the caller's own glob, like this broker's `globIgnoreFilterTransformer`) can no
  longer stage "any ignore list" the way the retired adapter proxy could; the proxy has to compute
  the SAME transformer output the broker will, ahead of time, duplicating a piece of the broker's own
  logic into its test double. Not wrong, but a real increase in proxy/broker coupling this unit is
  the first to hit.
- **A caller's own vocabulary can collide with a gateway export's name.** `fileScannerBroker`'s own
  parameter is `glob` (the caller-supplied search pattern); importing the gateway wrapper as `glob`
  would have silently shadowed it. `typecheck` caught it here (the shadowed identifier is not
  callable), but the failure mode is a plain `TS2349`-style "not callable" pointing at the call site,
  not at the import — worth a lint rule someday, not urgent given typecheck already catches it.

## Resolved by a follow-up unit: `globProxy` gained the adapter proxy's conveniences

A later unit fixed `packages/npm/src/glob/glob.proxy.ts` directly (task: "fix the gateway proxy to
be at least as capable as the adapter proxy it replaced"), rather than working around it from either
caller. It kept `returns`/`throws` byte-for-byte backward compatible (still an exact
pattern-and-full-resolved-options address — `file-scanner-broker.proxy.ts` needed no change) and
added, alongside them:

- A constructor-time safe default (`handle.calledWith([]).resolves([])`), mirroring the retired
  `globFindAdapterProxy`'s own catch-all — an unaddressed call now resolves empty instead of
  throwing.
- `returnsMatchingTail`/`throwsMatchingTail` — stages by the SAME first-wildcard-onward tail
  comparison `matchesGlobTail` used, and takes an OPTIONAL, PARTIAL `options` object (only the keys
  named are checked) instead of the full exact object `returns` requires.
- `getOptionsFor`/`getCallsFor` — reads back the real call(s) matched by pattern tail, the same
  read-back `getOptionsFor` gave on the retired adapter proxy.

**The actual 9 failures traced to a narrower, separate bug**, not the missing tail-matching itself:
`mcp-discover-broker.test.ts` (untouched by this unit, out of its file list) stages `pattern` as an
already cwd-prefixed FULL string (`` `${process.cwd()}/**/*.ts` `` in most cases, `'/default/cwd/**/*'`
in a few others) and hands it straight to `mcpDiscoverBrokerProxy()`'s `setupFileDiscovery`/etc.,
which delegate to `fileScannerBrokerProxy().setupFiles({ pattern, ... })` — a method THIS unit
designed to take a BARE glob SUFFIX and compute `${mockedRoot}/${pattern}` itself. Feeding it an
already-prefixed string doubles the prefix, so the exact address it stages never matches the real
call (whose cwd is always the mocked root), and — with the ignore list baked into that same exact
address — even a general tail-matching fix on `pattern` alone would not have closed the gap, since
the doubled prefix can also inject stray literal path segments into the ignore-list computation
(`globIgnoreFilterTransformer` reads literal segments out of whatever string it's handed as `glob`,
and a real absolute cwd sitting inside a `worktrees/` checkout SHARES a segment with the default
`**/worktrees/**` ignore rule).

**The fix was in the test file itself, not `mcp-discover-broker.proxy.ts`**: every `pattern`
construction across the file's 9 failing cases was rewritten to the bare suffix
`globResolveTransformer(input.glob)` actually produces (`'**/*'` when no `glob` key is given,
the `glob` value as-is when it already carries a wildcard or extension) — consistent with how
`file-scanner-broker.test.ts` already writes its own patterns, and with how a handful of this same
file's OTHER tests (the ones using `setupGrepFilteredEmpty`, which bypasses
`fileScannerBrokerProxy` entirely and stages the OLD `globFindAdapterProxy` directly) were already
written. No change was needed to `mcp-discover-broker.proxy.ts` at all — only to its test's own
setup code (never its assertions). `packages/mcp/src/brokers/file/scanner/file-scanner-broker.ts`
and its own proxy/tests were untouched and stayed green throughout.

Ward, scoped to `packages/npm/src/glob packages/npm/src/testing
packages/mcp/src/brokers/file/scanner packages/mcp/src/brokers/mcp/discover`:

```
lint:      PASS  2 packages (13 files passed/0 files failed, 13 discovered)
typecheck: PASS  2 packages (642 files passed/0 files failed, 642 discovered)
unit:      PASS  2 packages (5 files passed/0 files failed, 226 discovered)
```
