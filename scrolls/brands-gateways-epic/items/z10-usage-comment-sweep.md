# Z10: the comment sweep for USAGE lines that name deleted contracts

| | |
|---|---|
| Phase | Phase 6 — docs and finish (P1 before the master merge's defect swarm; EPIC "Merge to master", P1 row "the stale JSDoc USAGE lines naming the deleted `filePathContract`") |
| Source | F121's "Left standing, found here" (`items/f120-f129-bigbang-followups.md`); concessions 25 and 27 (standalone scalar brands are gone, B2) |
| Needs | the master merge green in `worktrees/gp-merge-master` (the sweep touches files master edited; run it there, once, on the merged tree) |
| Unblocks | Z07 |
| Packages touched | comments only, in every package's `.ts` and `.tsx` |
| Checks to run | `lint,typecheck,unit` on the touched files, once, as the regression pass (a comment-only edit cannot change typecheck or unit results; lint reads headers through `enforce-file-metadata`) |
| Split | one scripted run by the operator or one agent; a short hand queue (71 files) for agents, 1 to 3 files each |
| Runs alone | no; disjoint from Z02 and Z03 except `packages/mcp/src/brokers/architecture/folder-detail/architecture-folder-detail-broker.ts:6` (Z03-B) and `packages/mcp/src/transformers/folder-purpose/folder-purpose-transformer.ts:6` (Z03-C): run the sweep after those batches, or exclude those two files |

## Why

Agents copy a file's JSDoc USAGE block when they write a call. About 150 files still show `filePathContract.parse('/x')`, `AbsoluteFilePathStub()` and their kin, which no longer exist (B2 deleted every standalone scalar brand; `packages/shared/src/contracts/` holds only empty `file-path/`, `absolute-file-path/`, `content-text/`, `path-segment/`, `array-index/`, `file-contents/` and `repo-relative-path/` folders). A model reading `discover` output learns to import a contract that is not there.

## Census (the exact command)

```bash
python3 tmp/z-plan/usage-census.py          # per-name table: lines, files, name
python3 tmp/z-plan/usage-census.py AbsoluteFilePathStub   # every hit for one name
```

`tmp/z-plan/usage-census.py` reads every `.ts` and `.tsx` under `packages/` (skipping `node_modules`, `dist`, `.git`, `.ward`, `tmp`), collects every name any file exports (`export const|function|type X`, `export { X }`), then reports each identifier ending `Contract` (lower camel) or `Stub` (upper camel) that appears on a comment line (`*`, `//`, `/*`) and that nothing exports. Bash `grep` is hook-blocked, so the census is a python scan.

Measured at HEAD 84dea7b74 (the agent re-runs it on the merged tree; a number here is a measurement, not an inventory):

| Family | Comment lines | Files |
|---|---|---|
| `filePathContract`, `absoluteFilePathContract`, `relativeFilePathContract`, `FilePathStub`, `AbsoluteFilePathStub` (the F121 "about 150 files" family) | 341 | 293 (333 lines in implementation files, 6 in tests, 1 harness, 1 stub) |
| every undefined `*Contract`/`*Stub` name on a comment line | 758 | 559 |

Top names by lines: `absoluteFilePathContract` 133, `AbsoluteFilePathStub` 124, `contentTextContract` 66, `filePathContract` 50, `ContentTextStub` 32, `FileContentsStub` 13, `PathSegmentStub` 12, `EpochMsStub` 12, `SpecNameStub` 11, `importPathContract` 9, `errorMessageContract` 9. All are deleted scalar brands.

## What each line becomes

The replacement is the plain value the example passed in, because a loose scalar is plain (concessions 25 and 29).

| Comment text | Becomes |
|---|---|
| `xContract.parse(ARG)` | `ARG` (balanced-paren match, so `.parse(join('a', 'b'))` works) |
| `XStub({ value: ARG })` | `ARG` |
| `XStub()` or `XStub({})` | the default the deleted stub carried (`AbsoluteFilePathStub()` becomes `'/home/user/project/src/file.ts'`), read from `tmp/deletions/**/<x>.stub.ts` by the script |
| any other mention (prose, a stub with more keys, a contract whose deleted source was not a scalar, a multi-line call) | left alone, written to `tmp/z-plan/usage-sweep-hand.json` with file, line and reason |

Only names whose deleted contract (`tmp/deletions/**/*-contract.ts`) was a scalar brand are rewritten, so an object contract that was renamed is never flattened to its argument. Example, from the dry run:

```
- * pathToSubPathTransformer({ filepath: PathSegmentStub({ value: 'packages/orchestrator/src/contracts' }) });
+ * pathToSubPathTransformer({ filepath: 'packages/orchestrator/src/contracts' });
```

## The script and its dry-run proof

`tmp/z-plan/usage-sweep.py` is a dry run by default: it writes `tmp/z-plan/usage-sweep.diff` and `tmp/z-plan/usage-sweep-hand.json` and opens no source file for writing. `--apply` is the only mode that writes.

Dry run on this checkout (HEAD 84dea7b74): 573 lines rewritten in 450 files; hand queue 98 entries in 71 files (73 prose mentions, 12 stubs with no recorded default, 7 multi-line calls, 6 contracts not found as scalars). Files changed by package: shared 172, siegelense 80, ward 63, orchestrator 44, eslint-plugin 26, mcp 20, testing 13, hydration-recipes 7, cli 6, web 6, hydration 5, server 5, session-forensics 3.

Checks the script carries itself: for every rewritten line it asserts the line still starts with a comment marker and that its count of `*/` is unchanged (a literal containing `*/` would end a block early).

### Protocol for the run

1. After the merge is green: `python3 tmp/z-plan/usage-census.py | tail -1` (record lines and files), then `python3 tmp/z-plan/usage-sweep.py` (dry run) and read 40 lines of `tmp/z-plan/usage-sweep.diff`, at least one per package.
2. `python3 tmp/z-plan/usage-sweep.py --apply`.
3. `python3 tmp/z-plan/usage-verify.py`: for every changed `.ts`/`.tsx` file it compares the file with `git show HEAD:<file>` and fails on a changed non-comment line or a changed line count. Required result: `violations 0`.
4. `python3 tmp/z-plan/usage-census.py | tail -1`: the remaining lines are the hand queue plus non-scalar names; the difference from step 1 equals `lines_rewritten` in step 2's output.
5. `npm run ward -- --only lint,typecheck,unit -- <changed files>` is too long a list for one command; run it per package, `npm run ward -- --only lint -- packages/<pkg>` ... once each, since only `enforce-file-metadata` can react to a header edit. Ward is run by the operator, not this plan.
6. Hand queue: `tmp/z-plan/usage-sweep-hand.json` split 1 to 3 files per agent (71 files, about 30 agents is wasteful; group by the file's package and hand 3 per agent, which is 24). Each agent rewrites the prose so it names a live symbol or none, and checks the USAGE still reads true against the signature.

## Not in the sweep (report, do not edit here)

- `packages/mcp/CLAUDE.md` section "Paths from tool callers are `PathSegment`, not `FilePath`" teaches deleted contracts (`filePathContract`, `pathSegmentContract`, `absoluteFilePathContract`): Z04.
- Stale names in non-USAGE comments that the census also counts are rewritten the same way (they are comment lines); names in `README.md` files are not scanned.
- `packages/mcp/src/brokers/architecture/testing-patterns/architecture-testing-patterns-broker.ts:752` (names the removed `ban-primitives`) is teaching text: Z03-T1. `packages/mcp/src/responders/architecture/handle/architecture-handle-responder.ts:35` ("sharedContentTextContract is used to brand the packageName string") and the `ban-contract-in-tests` mention at `architecture-folder-detail-broker.ts:110` are single comments the owner of those files fixes (Z03-B for the second).
- About ten comments name `@dungeonmaster/ban-primitives` (for example `packages/web/test/harnesses/quest/quest.harness.ts:1029`, `packages/cli/src/transformers/package-scaffold-files/package-scaffold-files-transformer.ts:72`, `packages/@gateway/npm/src/zod/zod-string-schema/zod-string-schema.stub.ts:3`). They are not `*Contract`/`*Stub` names, so this script ignores them. One more scripted pass (`ban-primitives` mentions, hand-read) is a P3 follow-up.

## Open decisions

- **Z10-D1. Sweep the whole 758-line set or only the `filePathContract` family?** The mechanism is the same and the script already covers the whole set. Recommendation: the whole set (573 lines rewritten plus 98 hand entries), because `ContentTextStub` and `PathSegmentStub` mislead the same way.
- **Z10-D2. Plain value versus `Owner['field']` example.** A USAGE that passed `AbsoluteFilePathStub()` to a parameter that is now `Guild['path']` becomes a literal, which reads fine but does not typecheck as written. USAGE blocks are not compiled, so this is accepted (concession 29: only an owner-claimed parameter carries the owner type). Recommendation: accept.
