# G21: Gateway proxies offer loose addressing and call read-back

| | |
|---|---|
| Phase | Phase 1 — gateway foundation |
| Source | `scrolls/gateway/followup-sustainability.md`, item 28, lines 660-683 |
| Needs | [G19](g19-gateway-proxies-recorded-failures-no-catch-all.md) (fixes the catch-all defaults this item's addressing work would otherwise interact badly with) |
| Unblocks | [A04](a04-adapters-cli.md) through [A17](a17-adapters-web.md) (every package's adapter-deletion item needs these proxies to already support tolerant addressing and read-back before callers can move onto them) |
| Packages touched | `@gateway/bin`, `@gateway/node`, `@gateway/browser` |
| Checks to run | `lint,typecheck,unit` |
| Split | operator splits: one agent for `bin`, one for `node`, one for `browser` |
| Runs alone | no |

## Why

The adapter proxies this epic is about to delete gave their callers two things a plain gateway proxy
does not yet have: a TOLERANT way to address a staged call (so a caller that cannot predict every part
of the real call — a resolved cwd, a computed ignore-list — can still stage it), and CALL READ-BACK (so
a test can ask what a broker actually called the wrapper with). When the trial moved mcp's file scanner
onto the gateway `glob`, its callers broke for exactly this reason: the old adapter proxy matched a
pattern by its END, and let a test read back the real options a call sent; the plain gateway proxy did
neither, so the composing proxy either staged every possible call or duplicated the broker's own
ignore-list logic into itself. `globProxy` now has both (see G19's "Current state" for the exact
methods) — this item brings every other gateway proxy up to the same standard, following the specific
list of proxies the source doc found still missing it.

## Current state

Checked 2026-09-26 against the code (one example per surface, since the full lists below are already
counted by the source doc):

- `packages/@gateway/bin/src/git/current-branch/current-branch.proxy.ts` has three plain
  `setupX(): void` methods (`setupBranch`, `setupDetached`, `setupFailure`) and no read-back method at
  all — a test can stage what `gitRunProxy` returns for a fixed argument list, but cannot ask what
  arguments a caller actually passed.
- `globProxy` (already fixed, see G19) is the model this item is bringing every other proxy in the
  table below up to: `returnsMatchingTail`/`throwsMatchingTail` for tolerant, tail-matched addressing
  (with an optional partial-keys check on `options`), and `getOptionsFor`/`getCallsFor` for read-back.

Proxies still missing call read-back, from the source doc (re-verify each one still lacks it before
building — some may have gained it as a side effect of another Phase 1 item landing first):

| Package | Proxies |
|---|---|
| `bin` | every `git` proxy; `cp-run`, `cp-copy-recursive`; `kill-pid`, `kill-group`, `kill-run`; `lsof-listening-pids`; `npm-run`, `npm-install`, `npm-run-build`, `npm-run-script` |
| `node` | the read-shaped `fs/promises` proxies (`read-file`, `read-json-file`, `readdir`, `readdir-entries`, `realpath`, `readlink`, `stat`, `path-exists` and the rest; the write-shaped ones already have it); `net`'s `free-port-pair` and `is-port-free`; `readline`'s `line-reader` and `question` |
| `browser` | every `fetch`, `indexedDB` and `localStorage` proxy |

Check every new gateway proxy against these three points (item 23 withdraws the old advice to add a
safe default — do not add one; see G19):

- The real call joins a value the caller does not control, such as a resolved cwd, onto the value a
  test wants to stage. Offer a tolerant address, such as an end-of-pattern match or a predicate, beside
  the exact one.
- The replaced adapter proxy matched only SOME of the call's options. Offer an address that checks only
  the keys it names, so a caller that cannot know a computed option can still stage the call.
- The replaced adapter proxy offered call read-back, such as `getOptionsFor` or `getCallsFor`. Offer the
  same.

## Work

**Operator splits this into three groups: `bin`, `node`, `browser`.** Within each, split further by the
proxy list above, 2 to 4 proxies per agent.

For each proxy in the table:

1. Read the OLD adapter proxy it replaced (if it still exists — some may already be deleted by an
   earlier trial; if so, check `scrolls/adapters-to-one-place.md` or the current adapter's own git
   history for what its proxy offered) to see exactly what addressing and read-back its callers relied
   on.
2. Add a tolerant-address method (naming convention: follow `globProxy`'s `returnsMatchingTail` /
   `throwsMatchingTail`, or pick whatever reads clearly for that wrapper's own call shape — a `git`
   proxy's "tolerant" dimension might be "any cwd", not "any pattern tail", so the SHAPE of tolerance
   differs per wrapper; do not copy `glob`'s tail-matching logic verbatim onto proxies whose real call
   varies along a different axis).
3. Add `getOptionsFor` / `getCallsFor` (or whatever naming this proxy family already uses, if
   different) for read-back.
4. Keep every EXISTING exact-match method (`returns`, `throws`, etc.) working unchanged — this item adds
   capability, it does not replace what is already there, unless what is already there is one of G19's
   catch-all defaults (already handled by G19; do not re-introduce one here).
5. Colocated test coverage for the new methods, following whatever pattern the proxy's own existing
   test file uses.

## Lint rules this item adds or changes

None.

## Done when

- [ ] Every `bin` proxy in the table above (every `git` proxy, `cp-run`, `cp-copy-recursive`,
      `kill-pid`, `kill-group`, `kill-run`, `lsof-listening-pids`, `npm-run`, `npm-install`,
      `npm-run-build`, `npm-run-script`) offers tolerant addressing and call read-back.
- [ ] Every read-shaped `fs/promises` proxy under `node` (the doc's own list: `read-file`,
      `read-json-file`, `readdir`, `readdir-entries`, `realpath`, `readlink`, `stat`, `path-exists`, "and
      the rest" — re-verify the full membership of "the rest" against the actual folder listing before
      calling this item done), plus `net`'s `free-port-pair`/`is-port-free` and `readline`'s
      `line-reader`/`question`, offer the same.
- [ ] Every `fetch`, `indexedDB` and `localStorage` proxy under `browser` offers the same.
- [ ] No proxy touched by this item gained a catch-all default in the process.
- [ ] `npm run ward -- -- <files touched>` exits 0.

## Traps

- "The write-shaped [`fs/promises`] ones already have it" per the source doc — check this before
  re-doing work; the doc explicitly excludes them from this item's scope.
- Do not copy `globProxy`'s exact tail-matching predicate logic onto a proxy whose real call varies
  along a different axis (a `git` command's cwd, not a glob pattern's tail). Read what the OLD adapter
  proxy for each wrapper actually tolerated before deciding the new proxy's own addressing shape.
- This item is a prerequisite for EVERY Phase-2 adapter-deletion item (A04 through A17) — those items
  are the ones that will actually discover whether a given proxy's new addressing/read-back methods are
  sufficient for a real caller. If a Phase-2 agent reports that a proxy this item touched is still
  missing something a real caller needs, that is a real gap in this item's own work, not a Phase-2
  scope question.

## Plan — gateway gaps F34, F42, F43, F44

Four `@gateway/node` test-support gaps a Phase-2 caller hit while migrating (F34, F42, F43, F44a/b —
`triage-phase2.md`'s "Gateway gaps blocking work" and EPIC.md's own F-rows). Gateway files only; no
caller (cli, server, orchestrator) is touched here.

- `packages/@gateway/node/src/child_process/stream-lines/stream-lines.proxy.ts` — add a `getOptionsFor`
  read-back (F34), same shape as `run.proxy.ts`'s.
- `packages/@gateway/node/src/child_process/stream-lines/stream-lines.test.ts` — cover it.
- `packages/@gateway/node/src/process/read-stdin-to-end/read-stdin-to-end.proxy.ts` — add a `returns({
  contents })` staging method that owns the `process.stdin` swap, plus a `restore()` to undo it (F42).
- `packages/@gateway/node/src/process/read-stdin-to-end/read-stdin-to-end.test.ts` — rewrite onto the new
  proxy instead of the test's own local `withFakeStdin` helper.
- `packages/@gateway/node/src/fs__promises/rename/rename.proxy.ts` — add `getCallsFor` (F43), `ensure-dir`'s
  shape.
- `packages/@gateway/node/src/fs__promises/rename/rename.test.ts` — cover it.
- `packages/@gateway/node/src/fs__promises/rm/rm.proxy.ts` — add `getCallsFor` returning each call's full
  `[path, options]` tuple (F44a).
- `packages/@gateway/node/src/fs__promises/rm/rm.test.ts` — cover it, asserting the exact
  `[path, {recursive, force}]` tuple.
- `packages/@gateway/node/src/fs__promises/stat/file-stat.ts` — add `createdAtMs` to the `FileStat`
  interface (F44b).
- `packages/@gateway/node/src/fs__promises/stat/file-stat.stub.ts` — add a `createdAtMs` param.
- `packages/@gateway/node/src/fs__promises/stat/file-stat.stub.test.ts` — cover it.
- `packages/@gateway/node/src/fs__promises/stat/stat.ts` — read `stats.birthtimeMs` into `createdAtMs` on
  every branch.
- `packages/@gateway/node/src/fs__promises/stat/stat.proxy.ts` — thread an optional `createdAtMs` through
  every staging method.
- `packages/@gateway/node/src/fs__promises/stat/stat.test.ts` — cover it.
- `packages/@gateway/node/src/fs__promises/stat-if-exists/stat-if-exists.proxy.ts` — same threading.
- `packages/@gateway/node/src/fs__promises/stat-if-exists/stat-if-exists.test.ts` — cover it.
- `packages/@gateway/node/src/fs/stats/stats.stub.ts` — add an optional `createdAtMs` param (default
  `modifiedAtMs`, preserving today's behaviour) backing `birthtimeMs`/`birthtime`.
- `packages/@gateway/node/src/fs/stats/stats.stub.test.ts` — cover it.

`createdAtMs` is optional everywhere it is a STAGING input (proxy methods, `StatsStub`), defaulting to
`modifiedAtMs` when omitted — `renameProxy`/`statIfExistsProxy` are already composed outside this package
(cli's `rate-limits-snapshot-write-broker.proxy.ts`, hydration-recipes' `quest-persist-direct-broker.proxy.ts`),
and existing calls there must keep compiling unchanged. `createdAtMs` is REQUIRED on the real `FileStat`
result shape (`file-stat.ts`, `stat.ts`'s return, `FileStatStub`'s output type) since a real `stat()` call
always has a birth time.

Composing packages to re-run unit tests for (not edited): `cli`, `hydration-recipes`.

## Concessions made while executing

<Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table.>

## Plan — F46

Follow-up F46: Two `@gateway/node` proxies stage nothing and read nothing back (`readline`'s `questionProxy` and `child_process`'s `runFireAndForgetProxy`). Give both a staging method and a read-back, then move cli's two callers/proxies onto them.

Files to edit:
- `packages/@gateway/node/src/readline/question/question.proxy.ts` — implement `answers({ prompt, answer })` keyed by prompt text, and `getPromptsAsked()` / `getCallsFor()` read-back
- `packages/@gateway/node/src/readline/question/question.test.ts` — cover `answers` staging (trimmed answer, empty/whitespace fallback) and read-back
- `packages/@gateway/node/src/readline/question/question.ts` — unmodified; questionProxy handles input stream cleanup on close without altering production code
- `packages/@gateway/node/src/child_process/run-fire-and-forget/run-fire-and-forget.proxy.ts` — add `getCallsFor({ command })` returning each call's arguments
- `packages/@gateway/node/src/child_process/run-fire-and-forget/run-fire-and-forget.test.ts` — cover `getCallsFor({ command })`
- `packages/cli/src/brokers/create-package/resolve-request/create-package-resolve-request-broker.proxy.ts` — move onto `questionProxy().answers(...)` and expose `getPromptsAsked()`
- `packages/cli/src/brokers/create-package/resolve-request/create-package-resolve-request-broker.test.ts` — assert prompts asked via `proxy.getPromptsAsked()`
- `packages/cli/src/responders/cli/serve/cli-serve-responder.proxy.ts` — expose `getBrowserOpenCalls` delegating to `runFireAndForgetProxy().getCallsFor`
- `packages/cli/src/responders/cli/serve/cli-serve-responder.test.ts` — restore assertions on the exact command executed for browser open across platforms (darwin, win32, linux)

## Plan — F50

Follow-up F50: Add synchronous raw-bytes read `readFileBytesSync(path): Buffer` to `@gateway/node/fs` with its proxy, stub and test, mirroring async `fs__promises/read-file-bytes/`, and export it from the `fs` barrel.

Files to create:
- `packages/@gateway/node/src/fs/read-file-bytes-sync/read-file-bytes-sync.ts` — wrapper calling `readFileSync(path)` without encoding and returning `Buffer`
- `packages/@gateway/node/src/fs/read-file-bytes-sync/read-file-bytes-sync.proxy.ts` — proxy with `returns({ path, bytes })`, `missing({ path })`, `denied({ path })`, `isDirectory({ path })`, `notADirectory({ path })`, `throws({ path, error })`, `returnsMatchingPath({ path, bytes })`, `throwsMatchingPath({ path, error })`, and `getCallsFor({ path })`
- `packages/@gateway/node/src/fs/read-file-bytes-sync/read-file-bytes-sync.test.ts` — unit test for `readFileBytesSync` covering success, empty buffer, sad paths (`ENOENT`, `EACCES`, `EISDIR`, `ENOTDIR`), tolerant addressing via predicate, and call inspection
- `packages/@gateway/node/src/fs/read-file-bytes-sync/read-file-bytes-sync.stub.ts` — `ReadFileBytesSyncStub` returning a `Buffer`
- `packages/@gateway/node/src/fs/read-file-bytes-sync/read-file-bytes-sync.stub.test.ts` — unit test for `ReadFileBytesSyncStub`

Files to edit:
- `packages/@gateway/node/src/fs/fs.ts` — export `readFileBytesSync` from `./read-file-bytes-sync/read-file-bytes-sync`
- `packages/@gateway/node/src/fs/fs.test.ts` — assert `readFileBytesSync` is re-exported from `#gateway/node/fs`

## Plan — F57

Census of every `packages/@gateway/node/src/**/*.proxy.ts` whose wrapper takes an argument to key on
(2026-09-28), sorted by whether it already has a `getCallsFor`/`calls`-shaped method that returns
EVERY matching call's full argument tuple, in call order — not just the proxy's existing exact-match
staging methods (`succeeds`/`throws`/etc.), and not a `xFor`-style reader that only returns the LAST
matching call (`.at(-1)`).

**Already has full ordered read-back** (no work needed): every read-shaped `fs`/`fs__promises` proxy
G21's earlier passes covered, plus `rm`, `rename`, `unlink`, `ensure-dir`, `write-file-atomic`
(fs__promises), `rm-sync`, `ensure-dir-sync`, `symlink-sync`, `unlink-sync` (fs), the
`copy-dir-contents-entries-recurse` proxy's own `cpCallsFor`/`rmCallsFor`, `run`, `stream`,
`stream-lines`, `run-fire-and-forget`, `question`, `kill`, `exit`, `on` (these last three stage with
no address at all — like `crypto.randomUUID` — so their existing `callsMatching()` already returns
every call unaddressed, which counts as full read-back).

**Has only a last-call reader, not full ordered read-back** — the write-shaped proxies G21's "Traps"
section assumed were done, but whose `xFor` method is `.callsMatching([...]).at(-1)?.[...]`:
`append-file`, `append-lines-creating-parent`, `write-file`, `write-file-bytes`,
`write-file-creating-parent`, `write-file-from-base64` (delegates to `write-file-bytes`) under
`fs__promises`; `append-file-sync`, `write-file-sync` under `fs`; `spawn-detached` under
`child_process` (out of this pass's scope, see below).

**Has no read-back at all**: `copy-file`, `copy-dir-contents` (the outer proxy — its own
`copyDirContentsEntriesRecurseProxy` has one, but does not expose it), `symlink`,
`unlink-if-exists`, `write-file-exclusive` under `fs__promises`; `open-for-append-sync` under `fs`;
plus, outside this pass's write-side scope: `find-up-sync`, `glob-sync`, `is-fs-error`, `tail-file`,
`is-walked-file`, `walk-files-sync` (fs, all read-shaped or pure predicates); `run-sync` (child_process);
`fetch-json`, `fetch-ok`, `fetch-with-status` (fetch); `dynamic-import`, `resolve-package-root`
(module); `is-port-free`, `unix-socket-request`, `unix-socket-serve` (net); `get-env`,
`set-exit-code` (process); `line-reader` (readline); `is-native-error` (util__types).

**`close-sync` is a third case**: its `calls({ fd })` already returns the full ordered list, but only
for an fd the caller already knows — `openForAppendSync`'s real return value, which a caller closing
a leaked descriptor cannot always predict ahead of time. It needs the SAME tolerant-predicate address
`PathMatcher` gives path-keyed proxies, just for a number.

This is longer than about 12 proxies, so per this pass's dispatch instructions: do the four SL-FS1
named ones (`copy-file`, `copy-dir-contents`, `append-file`, `close-sync`) plus every remaining
`fs__promises` and `fs` WRITE-side proxy first (the two lists above, minus the already-done ones),
stop, and report the rest (the read-shaped `fs`/`fs__promises` predicates, and every non-fs domain)
under LEFT STANDING for a follow-up.

**Files this pass touches** (proxy + its colocated test; every wrapper's own `.ts` file is unchanged
— this pass adds proxy capability only):

- `packages/@gateway/node/src/fs__promises/copy-file/copy-file.proxy.ts` — add `getCallsFor({ from, to })` (PathMatcher on both, `rename.proxy.ts`'s shape)
- `packages/@gateway/node/src/fs__promises/copy-file/copy-file.test.ts` — cover it
- `packages/@gateway/node/src/fs__promises/copy-dir-contents/copy-dir-contents.proxy.ts` — add `cpCallsFor({ source })` delegating to the already-composed `copyDirContentsEntriesRecurseProxy().cpCallsFor`
- `packages/@gateway/node/src/fs__promises/copy-dir-contents/copy-dir-contents.test.ts` — cover it
- `packages/@gateway/node/src/fs__promises/append-file/append-file.proxy.ts` — add `getCallsFor({ path })`; keep `appendedContentsFor`
- `packages/@gateway/node/src/fs__promises/append-file/append-file.test.ts` — cover it
- `packages/@gateway/node/src/fs/close-sync/close-sync.proxy.ts` — widen `calls`'s `fd` param from `number` to a local `FdMatcher = number | ((value: unknown) => boolean)`, following `run.proxy.ts`'s precedent for widening a read-back-only param to accept a predicate
- `packages/@gateway/node/src/fs/close-sync/close-sync.test.ts` — cover the predicate form
- `packages/@gateway/node/src/fs__promises/append-lines-creating-parent/append-lines-creating-parent.proxy.ts` — add `getCallsFor({ path })` for the append handle; keep `appendedContentsFor`/`mkdirCallsFor`
- `packages/@gateway/node/src/fs__promises/append-lines-creating-parent/append-lines-creating-parent.test.ts` — cover it
- `packages/@gateway/node/src/fs__promises/symlink/symlink.proxy.ts` — add `getCallsFor({ target, path })`
- `packages/@gateway/node/src/fs__promises/symlink/symlink.test.ts` — cover it
- `packages/@gateway/node/src/fs__promises/unlink-if-exists/unlink-if-exists.proxy.ts` — add `getCallsFor({ path })` delegating to the composed `unlinkProxy().getCallsFor`
- `packages/@gateway/node/src/fs__promises/unlink-if-exists/unlink-if-exists.test.ts` — cover it
- `packages/@gateway/node/src/fs__promises/write-file-bytes/write-file-bytes.proxy.ts` — add `getCallsFor({ path })`; keep `writtenBytesFor`
- `packages/@gateway/node/src/fs__promises/write-file-bytes/write-file-bytes.test.ts` — cover it
- `packages/@gateway/node/src/fs__promises/write-file-creating-parent/write-file-creating-parent.proxy.ts` — add `getCallsFor({ path })` for the write handle and `mkdirCallsFor({ path })` for the mkdir handle (parity with `append-lines-creating-parent`); keep `writtenContentsFor`
- `packages/@gateway/node/src/fs__promises/write-file-creating-parent/write-file-creating-parent.test.ts` — cover both
- `packages/@gateway/node/src/fs__promises/write-file-exclusive/write-file-exclusive.proxy.ts` — add `getCallsFor({ path })` (had none)
- `packages/@gateway/node/src/fs__promises/write-file-exclusive/write-file-exclusive.test.ts` — cover it
- `packages/@gateway/node/src/fs__promises/write-file-from-base64/write-file-from-base64.proxy.ts` — add `getCallsFor({ path })` delegating to the composed `writeFileBytesProxy().getCallsFor`
- `packages/@gateway/node/src/fs__promises/write-file-from-base64/write-file-from-base64.test.ts` — cover it
- `packages/@gateway/node/src/fs__promises/write-file/write-file.proxy.ts` — add `getCallsFor({ path })`; keep `writtenContentsFor`
- `packages/@gateway/node/src/fs__promises/write-file/write-file.test.ts` — cover it
- `packages/@gateway/node/src/fs/append-file-sync/append-file-sync.proxy.ts` — add `calls({ path })` (sync proxies' established name, per `rm-sync`/`ensure-dir-sync`); keep `appendedContents`
- `packages/@gateway/node/src/fs/append-file-sync/append-file-sync.test.ts` — cover it
- `packages/@gateway/node/src/fs/write-file-sync/write-file-sync.proxy.ts` — add `calls({ path })`; keep `writtenContents`
- `packages/@gateway/node/src/fs/write-file-sync/write-file-sync.test.ts` — cover it
- `packages/@gateway/node/src/fs/open-for-append-sync/open-for-append-sync.proxy.ts` — add `calls({ path })` (had none)
- `packages/@gateway/node/src/fs/open-for-append-sync/open-for-append-sync.test.ts` — cover it

Every new method uses the `getCallsFor`/`calls` name already established in the file's own family
(`fs__promises` proxies composing `PathMatcher` use `getCallsFor`; `fs` sync proxies use `calls`),
per this item's own rule 3 ("or whatever naming this proxy family already uses"). No existing method's
name, parameter or behaviour changes; every addition is a new method, except `close-sync`'s `calls`,
whose accepted TYPE widens the way `run.proxy.ts`'s own `SpawnArgsMatcher` precedent widens a
read-back param to take a predicate.

**Not in this pass's scope** (reported under LEFT STANDING, not fixed here): the read-shaped/pure
`fs` proxies (`find-up-sync`, `glob-sync`, `is-fs-error`, `tail-file`, `is-walked-file`,
`walk-files-sync`) and every non-fs domain proxy still missing full read-back
(`run-sync`, `spawn-detached` under `child_process`; every `fetch` proxy; `dynamic-import`,
`resolve-package-root` under `module`; `is-port-free`, `unix-socket-request`, `unix-socket-serve`
under `net`; `get-env`, `set-exit-code` under `process`; `line-reader` under `readline`;
`is-native-error` under `util__types`).

