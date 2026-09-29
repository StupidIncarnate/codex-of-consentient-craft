# Wave 3.4: `as never` casts removed from test files

Operator run order. Each step is a dry run first (read the summary line), then the same command with `apply`, then the
gate. Run from the worktree root. Nothing here builds, commits or removes a file. The script edits test files only
(`.test.ts(x)`, `.integration.test.ts`, `.e2e.ts`, `.spec.ts`); a cast in a stub, proxy, harness or production file is
counted as `supportFileCasts` and left.

Measured 2026-09-29 on the tree after wave 3.3 part a (HEAD 8cb800bda): 2,920 removable casts in 438 files, 537
load-bearing casts kept. The table is the dry-run census, one row per package.

| Package | Files with casts | Removable | Kept | Support-file casts left |
|---|---|---|---|---|
| shared | 57 | 648 | 90 | 13 |
| orchestrator | 112 | 997 | 143 | 22 |
| web | 67 | 307 | 105 | 7 |
| server | 14 | 139 | 3 | 6 |
| eslint-plugin | 11 | 6 | 16 | 0 |
| hooks | 38 | 47 | 5 | 0 |
| ward | 17 | 16 | 3 | 0 |
| mcp | 28 | 343 | 51 | 95 |
| session-forensics | 18 | 13 | 13 | 0 |
| siegelense | 84 | 166 | 28 | 7 |
| tooling | 35 | 92 | 8 | 0 |
| testing | 21 | 107 | 14 | 6 |
| cli | 6 | 16 | 0 | 0 |
| hydration | 19 | 16 | 39 | 1 |
| hydration-recipes | 8 | 7 | 3 | 0 |
| config | 0 | 0 | 0 | 3 |
| local-eslint | 0 | 0 | 0 | 0 |

Each package's kept list is `tmp/phase34/b15-as-never/out/<pkg>-kept.txt` (one `path:line` per load-bearing cast; the
orchestrator's is `out/orchestrator-kept.txt`), and its diff is `out/<pkg>.diff`. The kept casts wait for Phase 4.
`config` and `local-eslint` have nothing to do; skip them.

## Setup

The script and `lib/` must be the current copies in `tmp/phase34/` (the script has no `rm`, `unlinkSync` or `rmSync`;
it only rewrites the test files it names):

```bash
cp scrolls/brands-gateways-epic/phase34-scripts/b15-as-never/run.cjs tmp/phase34/b15-as-never/run.cjs
cp scrolls/brands-gateways-epic/phase34-scripts/lib/*.cjs tmp/phase34/lib/
```

Every command below takes `node --max-old-space-size=16000`; it is left off the lines to keep them short. A dry run
takes 0 to 70 seconds per package (orchestrator is the slowest). Dry runs of different packages may run side by side;
`apply` runs go one package at a time, because each is gated and committed alone.

## Package order

Dependency order, `shared` first; orchestrator, web and siegelense each run alone in their own step, and no step
touches two packages:

1. `shared`
2. `testing`
3. `orchestrator` (alone)
4. `web` (alone)
5. `server`
6. `eslint-plugin`
7. `hooks`
8. `ward`
9. `mcp`
10. `session-forensics`
11. `siegelense` (alone)
12. `tooling`
13. `cli`
14. `hydration`
15. `hydration-recipes`

## Per step

`<pkg>` is the step's package. Run the four parts in this order.

1. Snapshot the tree before the edit, so the commit list is exact:

   ```bash
   git status --porcelain | sort > tmp/phase34/b15-as-never/pre-<pkg>.txt
   ```

2. Dry run, read the summary line (`removed`, `kept`, `supportFileCasts`) against the table above:

   ```bash
   node tmp/phase34/b15-as-never/run.cjs <pkg>
   ```

3. Apply:

   ```bash
   node tmp/phase34/b15-as-never/run.cjs <pkg> apply
   ```

4. Gate (rule F). The edit touches test files only, so the gate is that package alone:

   ```bash
   npm run ward -- --only lint,typecheck,unit -- packages/<pkg>
   ```

   Read ward's exit code, never a piped `tail` (EPIC lesson: a piped lint hid a red and a commit followed). Unit stays
   in the gate: a cast can hide an `any` flow, and an assertion that compared a stub's branded value now compares a
   literal. On a red, read the failing test, restore the casts in that file (`out/<pkg>.diff` holds the exact
   removals), and record the file as a hand item; do not widen the gate.

5. After green, list the commit files. The script's own diff names every file it changed, and the porcelain diff
   catches anything ward's lint `--fix` reflowed:

   ```bash
   python3 - <<'E' > tmp/phase34/b15-as-never/commit-<pkg>.txt
   import re
   print('\n'.join(sorted(set(re.findall(r'^\+\+\+ b/(.+)$', open('tmp/phase34/b15-as-never/out/<pkg>.diff').read(), re.M)))))
   E
   git status --porcelain | sort | comm -13 tmp/phase34/b15-as-never/pre-<pkg>.txt - | cut -c4-
   ```

   The first list is the script's files; the second is every path whose status changed since the snapshot. Stage the
   union of the two, and only that, then commit on the current branch (one commit per package, message naming the
   checks run: `lint,typecheck,unit` on `packages/<pkg>`). A file already modified before step 1 keeps the same status
   letter, so it is absent from the second list; the first list covers it.

## After the last package

Rule F step 3: run `integration` once over every package the wave touched, fix every red, then `e2e` for web. Then
re-run the dry run over every package: `removed` should read 0 everywhere, and each `out/<pkg>-kept.txt` is the
Phase 4 hand queue. Support-file and production-file casts (the `supportFileCasts` column) are not part of this wave.

## Proof on copies

`--sample-out` writes changed files, laid out as repo paths, into a dir instead of `packages/`, and
`lib/verify-sample.cjs` typechecks each one on an in-memory overlay against today's disk. Wave 3.3's exports are
committed, so the exports overlay is off:

```bash
node tmp/phase34/b15-as-never/run.cjs <pkg> --sample-out=tmp/phase34/b15-as-never/sample-<pkg>
node tmp/phase34/lib/verify-sample.cjs tmp/phase34/b15-as-never/sample-<pkg> --no-exports-overlay
```

The verify exit code is 0 when the overlay adds no diagnostic. It proves types, not behaviour: run each package's unit
tests, which the gate does.
