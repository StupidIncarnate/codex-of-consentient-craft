# T08: Read every catch-everything implementation

| | |
|---|---|
| Phase | Phase 5 — tests and mocking |
| Source | `scrolls/brands-types-tests-rules.md`, order step 10's last sentence (lines 2456-2458) and T5's figures (1846-1851) |
| Needs | T05 |
| Unblocks | T09 |
| Packages touched | any package holding one of the rebuilt list's implementations — not knowable until the list is rebuilt |
| Checks to run | `lint,typecheck,unit,integration`, scoped per file fixed |
| Split | operator splits after the list is rebuilt, 2-4 files per agent |
| Runs alone | no |

## Why

Once T05 replaces hand-made, code-less failures with recorded ones, a test that used to pass against
`new Error('ENOENT: …')` with no `.code` may now fail — because the recorded failure carries a real
`.code`, and the implementation under test only ever checked `catch { ... }` with no code-based
narrowing. Of 92 implementations tested with a code-less error, 64 catch errors themselves, and 58 of
those catch everything — the only shape that passes a test built on an invented, code-less failure. Some
of those 58 are correct today (a cache that should start fresh on any unreadable state), and some are
wrong (a user's own settings file, where "start fresh" silently discards what the user wrote —
`settings-permissions-add-broker.ts` is the source doc's own example of this).

## Current state

The source doc's own lists (`tmp/lint-audit-1.tsv`, `lint-audit-2.tsv`, `lint-audit-3.tsv`,
`lint-audit-new-rules.tsv`, `teaching-text-audit.tsv`, and whatever produced the 92/64/58 figures) live in
`tmp/` **of the main checkout**, not this worktree. Checked 2026-09-26: this worktree's own `tmp/`
directory holds a different set of files entirely (`branch-files.txt`, `branch-ward.log`,
`gateway-shape-measure.config.js`, `platform-globals-measure.mjs`, `raw-import-measure-results.json`,
`restructure/`, `node16-probe/`, `adapters-fresh/`, `gateway-scaffold/`, none of the audit `.tsv` files
the source doc names). This confirms the item description's own claim: the list has to be rebuilt here,
it does not carry over from the main checkout's worktree-local `tmp/`.

## Work

1. **Rebuild the list.** Find every function that: (a) has a colocated test staging a hand-made,
   code-less `Error` as its only failure case, and (b) itself contains a `catch` block that does not
   narrow on the error's `.code`, `.errno`, `.syscall`, or an instance check — i.e. it catches everything.
   A `python3` `os.walk` plus a regex pass over `*.test.ts`/`*.integration.test.ts` files for a
   `new Error(` with no adjacent `code:`/`.code` in the same stage, cross-referenced against the sibling
   implementation file's own `catch` blocks, is a reasonable starting approach — this is analysis work,
   and the exact method is left to the executing agent's judgement, since the source doc's own method
   (whatever produced `lint-audit-*.tsv`) is not preserved here.

2. **For each implementation found, decide whether "catch everything, treat as absent/default" is
   correct or wrong for that data**, using the source doc's own worked distinction:
   - **Correct**: a cache, a derived/regenerable file, anything where starting fresh loses nothing a user
     put there. "Unreadable means start fresh" is right for a cache.
   - **Wrong**: a user's own settings file, or anything a person wrote by hand that the code would
     silently discard on any parse or read failure. `settings-permissions-add-broker.ts` is the doc's own
     named example of this — confirm it still exists at that name/path before treating it as a worked
     example; if Phase 2 or Phase 4 renamed or moved it, use its successor.

3. **Fix the ones that should not catch everything.** Narrow the `catch` to the specific failure it
   should treat as "absent" (e.g. `ENOENT` only), and let every other error propagate. Update each
   implementation's test to stage the recorded failure it should tolerate AND a second, different failure
   it should now let through (asserting the propagation, not just the tolerance) — this is what proves
   the fix actually narrows the catch rather than just changing which invented error the test uses.

4. **Leave the ones that are correct alone**, but confirm their test now stages a recorded failure (T05's
   job) rather than a hand-made one, even where the catch-everything behaviour itself is right.

5. **Split the fix work** into batches of 2-4 files per agent once the list exists, grouped by package.

## Lint rules this item adds or changes

None — this is a manual read-and-fix pass, not a lint rule. Do not try to write a rule that detects
"wrong" catch-everything automatically; the doc is explicit that this needs a human (or model) judgement
call per implementation (cache vs. user settings), not a structural check.

## Teaching text this item changes

None directly.

## Done when

- A fresh, dated list of catch-everything implementations tested only against a code-less error exists
  (even if only as this item's own working notes, not a committed file — the CLAUDE.md comment
  discipline rule against recording counts that grow applies to any note the agent leaves behind: record
  file paths and what was decided, not a running tally).
- Every implementation on the list has been read and a decision made: correct as-is, or narrowed.
- Every "wrong" one has been narrowed, with a test proving both the narrowed tolerance and the now-visible
  propagation of other errors.
- `npm run ward -- --uncommitted` exits 0 on every touched file.

## Traps

- This item needs T05 done first — T05 is what makes recorded failures available to stage; T08 leans on
  those same stubs to build the "second, different failure" test case for each narrowed catch.
- Do not try to fix every catch-everything implementation in one pass — split by package, 2-4 files per
  agent, per the dispatching rule in `CLAUDE.md`.
- A file this item touches may have moved during Phase 2 or Phase 4 (adapter deletion, brand migration);
  if the doc's named example (`settings-permissions-add-broker.ts`) is gone, find its successor by what it
  does (reads a user's own settings), not by grep for the old name.

## Concessions made while executing

<Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table.>
