# DEF-211: A ward scope that reaches no package exits 0 having run nothing, and no guard catches it

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Priority | P1: a ward scope that reaches nothing exits 0, so a check silently checks nothing |
| Package | ward |
| Found | 2026-09-30, walkthrough case WD-35 (reproduced live per `packages/ward/CLAUDE.md`) |
| Moved from | `scrolls/walkthrough/LEDGER.md`, "Suspected defects from the exploration" row "WD-35", and `scrolls/walkthrough/features/07-ward.md`, "Known open items"; 2026-09-30 |

## What is wrong

`npm run ward -- --only e2e --onlyTests "XYZNONEXISTENT" -- <a ward test file>` exits 0 having run nothing, because `@dungeonmaster/ward` is not e2e-eligible.
Every early return before a runner is spawned (`discoveredCount === 0`, `no matching unit test files in passthrough`, a package not e2e-eligible) records no
`testNamePatternMatch`, so `hasUnmatchedTestNamePatternGuard`'s precondition fails. `hasCheckDiscoveryMismatchGuard` and `hasNoFilesProcessedGuard` miss it too
(the first needs `discoveredCount > 0`, the second drops `skip` checks). See `packages/ward/CLAUDE.md` lines 112-118.

## What should happen

A scoped run that reaches no package, or whose every check skipped, fails or at least says "nothing ran" (the 0-file git scope already says so).

## Where to look

- `packages/ward/CLAUDE.md:112-118`
- `hasUnmatchedTestNamePatternGuard`, `hasCheckDiscoveryMismatchGuard`, `hasNoFilesProcessedGuard` in `packages/ward`

## History

Moved here from the walkthrough docs on 2026-09-30. No fix attempted.
