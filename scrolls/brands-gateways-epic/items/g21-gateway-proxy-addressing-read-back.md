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

## Concessions made while executing

<Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table.>
