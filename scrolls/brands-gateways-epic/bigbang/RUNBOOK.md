# Big-bang brand run: operator runbook

Every Phase 4 brand script runs back to back on `gateway-pivot`. Each run's output is committed even while the tree is red.
Fixer agents start only when the last step here is committed. W9 (dead re-parses), W8's `--responders` pass and W10 wait
for a green typecheck.

Planned 2026-09-29 against HEAD 83774d89a. Counts below are from dry runs on that tree.

## Rules for the whole run

1. Run every command from the worktree root. Scripts run from their `tmp/` copies, never from `scrolls/`.
2. One script process at a time. The scripts read `packages/` from disk, so a second run would see half-applied output.
3. After every apply: `git add -A packages && (git diff --cached --quiet || git commit -q -m "<wave> <name>: script output (tree red)")`.
   `git add -A packages` records moved-away files as deletions; the moved copies sit in `tmp/deletions/<wave>/` (gitignored).
4. After every apply that touched `packages/eslint-plugin` or `packages/local-eslint`, check that the lint config still loads:
   `node -e "require('tsx/cjs'); require('./eslint.config.js')"`. `eslint.config.js` loads that plugin from source, and a
   production import of a moved contract crashes every lint run. If it fails, fix that import before the next run.
5. Keep every run's stdout: `> tmp/bigbang/logs/<wave>-<name>.log 2>&1`. The log and the script's leftovers file are the
   fixer queue's input.
6. `df -h /` before each wave. W5 alone writes about 140 leftovers files.

## Order

| # | Wave | What | Why this position |
|---|---|---|---|
| 0 | prep | Copy the scripts and apply patches P1 to P8 | Four scripts have no `apply` mode, and three emit stale stub specifiers |
| 1 | W1 | 104 never-a-field brands go plain (`w1-runs.txt`) | Goes first while the tree is green. Its gate is line-keyed (see the red-tree table) |
| 2 | W3-pre | Hand pre-step H1 | |
| 3 | SD12 | R8's parameter retype plus its test fallout, one run | Runs before W3. Its stub map drops a stub whose contract file is gone (`b13-test-fallout/run.cjs:35` "if (!fs.existsSync(contractFile)) continue;"), and W3 moves those contract files away |
| 4 | W3 | 18 owned ids (`w3-runs.txt`) | |
| 5 | W4 | 8 ownerless ids (`w4-runs.txt`) | Before W2, because `RunId --pkg=ward` derives its owner const from `ward-result-contract.ts` |
| 6 | W2 | 8 renames (`w2-renames.json`), then the ward rename (`w2-renames-ward.json`) | Before W5, so W5 derives brand texts from the new owner names |
| 7 | W5 | 141 value-brand groups (`w5-runs.txt`; the last line is ProcessId from W4) | |
| 8 | W6 | Object-brand fallout script, then the R2 and R7 autofixes | The script brands the contracts itself; see step 8 |
| 9 | W7 | B14 shape contracts | |
| 10 | W8 | `z.unknown()` rows, `--only=json,own` | Rows are found by file path, so it runs before any W2 folder rename |
| held | W8-r | `--responders` | NEEDS-GREEN |
| held | W9 | `b15-dead-reparse` | NEEDS-GREEN |
| held | W10 | Rules on, full ward, `build:clean`, `check:consumer` | |

This moves W2 after W4, where the EPIC order had W2 first. The W2 lifts (below) move out of the run entirely.

## Step 0: prep and patches

```bash
mkdir -p tmp/bigbang/logs tmp/deletions
[ -d tmp/phase34 ] || cp -a scrolls/brands-gateways-epic/phase34-scripts tmp/phase34
[ -d tmp/phase34-feasibility ] || cp -a scrolls/brands-gateways-epic/phase34-scripts/feasibility tmp/phase34-feasibility
[ -d tmp/phase34/feasibility/b13 ] || cp -a scrolls/brands-gateways-epic/phase34-scripts/feasibility/b13 tmp/phase34/feasibility/b13
```

`codemod.cjs` requires `../../phase34/lib/repo.cjs`, so it runs from `tmp/phase34-feasibility/b15/`.

Every patch goes on the `tmp/` copy. Copy each patched script back to `phase34-scripts/` in its own commit.

| Patch | File:line | Change | Why (evidence) |
|---|---|---|---|
| P1a | `tmp/phase34-feasibility/b15/codemod.cjs:51` | After the `const users = ...` line add: `const ownDir = lib.workspaceOf(contractFile, ws).dir + path.sep;` and `users.sort((a, b) => (b.startsWith(ownDir) ? 1 : 0) - (a.startsWith(ownDir) ? 1 : 0));` | Callers are gated before the brand's own package is retyped, so the gate restores them. `baseName` dry run: 49 edits accepted, 361 restored, 77 new diagnostics. With this sort: 350 accepted, 60 restored, 8 new diagnostics |
| P1b | same file, after line 207 | Apply block A (below) with chunk `W1` | The script only writes `--sample-out`. It has no `apply` |
| P1c | same file, lines 182-205 (optional) | Wrap in `if (!process.argv.includes('--no-check')) { ... }` | This whole-repo check only reports. It is most of a shared/testing brand's ~5 min |
| P2a | `tmp/phase34/b15-value-brands/run.cjs:343` | ``for (const s of [`${wt.name}/contracts`, `${wt.name}/${path.relative(path.join(wt.dir, 'src'), targetFile).replace(/\.tsx?$/u, '').split(path.sep).join('/')}`]) {`` | Since B03 no stub is in a `contracts` barrel, so a cross-package `OwnerStub(...)` wrap has no import path and is dropped |
| P2b | same file, after line 528 | Apply block A with chunk `W5` | `:22` "A dry run: nothing under packages/ is written and nothing is deleted." |
| P3a | `tmp/phase34/b12-object-brand-fallout/run.cjs:157-160` | Same two-candidate loop as P2a: resolve each specifier and return the first whose declaring file is `targetFile`, else `null` | Same stale barrel assumption (stub imports in test support) |
| P3b | same file, after line 343 | `if (process.argv.includes('apply')) for (const [f, t] of overlay) if (t !== null) fs.writeFileSync(f, t);` | `:16` "Nothing under packages/ is written." It deletes nothing |
| P4a | `tmp/phase34/b13-test-fallout/run.cjs:59` | ``return `${stub.pkg.name}/${path.relative(path.join(stub.pkg.dir, 'src'), stub.file).replace(/\.tsx?$/u, '').split(path.sep).join('/')}`;`` | Measured today, unpatched: 1,781 to 1,266 diagnostics, mostly "stub X unreachable". Patched: 1,781 to 83 |
| P4b | same file, after line 233 | `if (process.argv.includes('apply')) for (const f of new Set([...retypeOverlay.keys(), ...touched])) fs.writeFileSync(f, currentText(f));` | `:11` "Nothing under packages/ is written". It deletes nothing |
| P5 | `tmp/phase34/b14-shape-contracts/run.cjs:256` | Replace `` `${r.pkg}/contracts` `` with ``${r.pkg}/${path.relative(path.join(S.ws.find((w) => w.name === r.pkg).dir, 'src'), r.file).replace(/-contract\.ts$/u, '.stub').split(path.sep).join('/')}`` | Generated stubs import `XStub` from `@dungeonmaster/<pkg>/contracts`. Dry run today: 66 generated, 69 gate-dropped. Patched: 118 generated, 17 gate-dropped |
| P6 | `tmp/phase34/b15-rename/rename.cjs:77` | `if (j.refused \|\| !service.getProgram().getSourceFile(j.abs)) continue;` | Unpatched, the W2 batch crashes: "Could not find source file: .../folder-config.stub.ts" (a dependent's program lacks the file) |
| P7 | `tmp/phase34/b11-contract-merge/move.cjs:199` | Replace `for (const f of losing) fs.rmSync(f);` with a move to `tmp/deletions/W2/<rel path>` (`fs.mkdirSync(dirname)`, `fs.renameSync`) | EPIC rule 20. Needed only by the deferred W2 lifts |
| P8 | `tmp/phase34/b15-id-brands/run.cjs:618` (optional) | Replace `'W3'` with `process.env.CHUNK ?? 'W3'` and run W4 with `CHUNK=W4` | W4's moved files then land under `W4/` instead of `W3/` |

Apply block A (P1b, P2b; `<CHUNK>` is `W1` or `W5`):

```js
if (process.argv.includes('apply')) {
  for (const [f, t] of overlay) {
    if (t !== null) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, t); continue; }
    const mv = path.join(ROOT, 'tmp', 'deletions', '<CHUNK>', rel(f));
    fs.mkdirSync(path.dirname(mv), { recursive: true });
    if (fs.existsSync(f)) fs.renameSync(f, mv);
  }
  console.log(`applied ${overlay.size} files`);
}
```

Optional P9: change `tmp/phase34/lib/repo.cjs:490`. The gate key there contains the line number, so in a file that is already red any
edit that shifts lines looks like new diagnostics, and line 519 then restores every edit in the file. A count-per-`code:message`
key would fix that. W1 runs first, so it barely needs P9. W9's `dead-reparse` uses the same gate.

## The run sheet

A dry run is the apply line without `apply`. Both print the new-diagnostic count.

| # | Command (apply form) | Runtime / peak memory (measured) | Writes | Deletes |
|---|---|---|---|---|
| 1 | W1 loop below | shared/testing brand ~5 min / 12.7 GB (`baseName`: 292 s, 12.7 GB); one-package brand ~15 s / 1.5 GB (`functionName`). About 3 h total | `packages/` only; log | contract, stub, contract test moved to `tmp/deletions/W1/` (P1b) |
| 2 | H1 by hand | minutes | 3 orchestrator files | none |
| 3 | `node --max-old-space-size=20000 tmp/phase34/b13-test-fallout/run.cjs --leftovers=tmp/bigbang/logs/sd12-leftovers.txt apply` | 332 s / 7.5 GB | `packages/` (retype + call sites); leftovers file | none |
| 4 | W3 loop below | ~5 min / 5 GB per brand (`InstanceId`: 290 s, 4.97 GB), about 1.5 h | `packages/`; `tmp/phase34/b15-id-brands/out/<Brand>-leftovers.json` | standalone contract and contract test moved to `tmp/deletions/W3/` (`:618`, `renameSync`) |
| 5 | W4 loop below (`CHUNK=W4` with P8) | same, about 40 min | new owner contract, stub and test for agent, siege-instance, siege-run and session; barrel line | as W3 |
| 6 | `node --max-old-space-size=16000 tmp/phase34/b15-rename/rename.cjs --batch=scrolls/brands-gateways-epic/bigbang/w2-renames.json apply`, then the same with `w2-renames-ward.json` | 18 s / 1.4 GB | renamed identifiers; `out/leftovers.txt`, `out/last-run.diff` | none. Folders and files keep their old names (hand, deferred) |
| 7 | W5 loop below | 5-15 min per shared brand (`errorMessage` 279 s / 4.5 GB; `filePath` ~15 min, memory not recorded), 1-3 min elsewhere. About 7 h | `packages/`; `tmp/phase34/b15-value-brands/out/<const>-leftovers.json` | contract, stub, contract test moved to `tmp/deletions/W5/` (P2b) |
| 8a | `node --max-old-space-size=40000 tmp/phase34/b12-object-brand-fallout/run.cjs apply` | about 17 min at a 40 GB heap (SD5 note). Not dry-run whole today: over the 20 GB limit | `packages/`; `out/leftovers.json` | none |
| 8b | `BRAND_FIX_RULES=r2 node_modules/.bin/eslint -c scrolls/brands-gateways-epic/bigbang/brand-fix.config.js --fix packages/*/src/contracts` | cli alone 4 s; whole repo not timed | contracts only | none |
| 8c | `BRAND_FIX_RULES=r7 node_modules/.bin/eslint -c scrolls/brands-gateways-epic/bigbang/brand-fix.config.js --fix packages/*/src/contracts` | not timed; hooks + session-forensics dry run: 78 fixable leaves | contracts only | none |
| 9 | `node --max-old-space-size=32000 tmp/phase34/b14-shape-contracts/run.cjs apply` | 337 s / 2.6 GB (dry, patched) | new contract, stub and test per shape; gateway schema files for Map, Set and Error fields; `out/generated.json`, `out/leftovers.{json,txt}` | none (in-file aliases removed) |
| 10 | `node --max-old-space-size=32000 tmp/phase34/b15-unknown-fields/run.cjs --only=json,own apply` | about 7 min at a 32 GB heap (README). With the gate, not dry-run today | `packages/`; `out/leftovers.json` | none |

Step 8 order matters. `b12-object-brand-fallout` brands only contracts that have no brand yet (`run.cjs:66`
"if (cls !== 'object' && cls !== 'derived') continue;"), and its rewriter knows only the owners it branded itself (`:82`).
If R2's autofix runs first, the script finds no owners and rewrites nothing. The script brands top-level objects only. 8b then
brands nested objects and fixes wrong brand texts (`wrongBrandText`, which renames a type and adds fallout), and removes
brands from enums, literals and booleans. 8c brands the remaining leaves. Dry-run form for 8b and 8c:
`--fix-dry-run -f json -o tmp/bigbang/logs/r2-dry.json`. `brand-fix.config.js` removes every other rule and turns off
unused-disable reporting, so `--fix` touches no other rule's fixes and does not delete `eslint-disable` comments.

### Loops

The hooks here block `grep` and `sed`, so the loops skip comments with `case`.

```bash
# W1 (dry run: drop `apply`)
while read -r c f; do
  case "$c" in ''|\#*) continue;; esac
  node --max-old-space-size=20000 tmp/phase34-feasibility/b15/codemod.cjs --brand=$c --file=$f apply </dev/null > tmp/bigbang/logs/w1-$c.log 2>&1 || { echo "FAIL $c"; break; }
  git add -A packages && (git diff --cached --quiet || git commit -q -m "W1 $c: plain (script output, tree red)")
done < scrolls/brands-gateways-epic/bigbang/w1-runs.txt

# W3 (then W4: same loop over w4-runs.txt, with CHUNK=W4 in front of node)
while read -r args; do
  case "$args" in ''|\#*) continue;; esac
  node --max-old-space-size=16000 tmp/phase34/b15-id-brands/run.cjs --brand=$args apply </dev/null > "tmp/bigbang/logs/w3-${args%% *}.log" 2>&1 || { echo "FAIL $args"; break; }
  git add -A packages && (git diff --cached --quiet || git commit -q -m "W3 ${args%% *}: owner id (script output, tree red)")
done < scrolls/brands-gateways-epic/bigbang/w3-runs.txt

# W5 (the first five lines are the trials: read each one's log before the loop moves on, or run them one at a time)
while read -r c f flags; do
  case "$c" in ''|\#*) continue;; esac
  node --max-old-space-size=24000 tmp/phase34/b15-value-brands/run.cjs --brand=$c --file=$f $flags apply </dev/null > tmp/bigbang/logs/w5-$c.log 2>&1 || { echo "FAIL $c"; break; }
  git add -A packages && (git diff --cached --quiet || git commit -q -m "W5 $c: derived field brands (script output, tree red)")
done < scrolls/brands-gateways-epic/bigbang/w5-runs.txt
```

W1's big brands run alone and first: `baseName`, `relativePath`, `fileContent`, then the three `globPattern` copies (shared,
ward, tooling). `cliArg` is not a W1 brand: it is `scanConfig.paths`, so it is in W5. eslint-plugin's `filePath` is retyped
as part of W5's `filePathContract` group.

W1 excludes three kinds of row:
- the 17 NOT PLAIN YET rows (hand; see H6);
- the never-a-field copies that W5's same-name group retypes: mcp `ContentText`, eslint-plugin `EslintRuleName`, testing
  `ExitCode` and `ProcessOutput`, eslint-plugin, hooks and server `FilePath`, hydration-recipes `RecipeInputKey`, web
  `TimeoutMs` and `ToolName`;
- the 10 rows whose file is already gone.

W5's `fileNameContract` and `pixelCoordinateContract` lines carry `--no-group`. The copies they leave out are eslint-plugin
`FileName` (a no-slash regex) and web `PixelCoordinate`, which are NOT PLAIN YET.

W3 and W4 each leave one row out:
- `PieceId` (see H2), kept out of `w3-runs.txt`;
- `ToolUseId` (see H3), kept out of `w4-runs.txt`.

## Red-tree verdicts

| Script | Verdict | Evidence |
|---|---|---|
| W1 `codemod.cjs` | SAFE-IF-RUN-FIRST (while the only red in the tree is W1's own) | Per-file gate `codemod.cjs:152` "const accepted = lib.gateEdits(...)". Its baseline key has the line (`repo.cjs:490`), and a diagnostic outside any edited statement restores all edits (`repo.cjs:519` "(hits.length ? hits : accepted).forEach((c) => restore.add(c));"). In a file that is already red, a dropped import line shifts every old diagnostic and nothing is accepted. It never aborts. It moves the contract even when the gate kept some uses (`:168`), so dangling imports go to the fixer queue |
| W2 `rename.cjs` | SAFE-STACKED | TypeScript's symbol rename (`:78` `findRenameLocations`). It misses only files whose import of the declaring module no longer resolves. It checks no types |
| W2 `move.cjs` | SAFE-STACKED (deferred) | Syntactic resolution. Refuses when schema texts differ |
| SD12 `b13-test-fallout` | SAFE-STACKED | Retype is syntactic (name matcher). Baseline is a second LanguageService over disk, keyed by code and message (`:79`). A file whose count rises is reverted. It accepts an `any` expression as a string (`:172`) |
| W3/W4 `b15-id-brands` | SAFE-STACKED | Retype is syntactic. The typecheck compares against a per-package baseline from disk, keyed without the line (`:479` "`${d.code}:${...messageText...}`", `:506`). The rewriter acts only on new diagnostics that name this brand |
| W5 `b15-value-brands` | SAFE-STACKED (degrades to leftovers) | Same baseline (`:292`). The rewriter reads checker types (`:385` "checker.getContextualType(prop.parent)", `:428` complete-literal check). A broken contextual type yields no brand, and the edit becomes a leftover. It does not produce a wrong wrap |
| W6 `b12-object-brand-fallout` | SAFE-IF-RUN-IMMEDIATELY-AFTER W5 | Pass 1 wraps every literal in a file with new diagnostics whose contextual type carries an owner brand (`:261` "hitsOf(checker.getContextualType(n), checker.getTypeAtLocation(n))"). A wrong-but-valid annotation left by an earlier retype would wrap the literal in the wrong owner's parse, which throws at runtime. Run it after every retype and before any hand fixing |
| W6 R2/R7 autofix | SAFE-STACKED | Syntax only (R2), or the syntactic owner index (R7) |
| W7 `b14-shape-contracts` | SAFE-STACKED | Census and printing are syntactic. The gate baseline is disk, keyed by code and message (`:542`). On a red tree it drops more shapes into leftovers |
| W8 `b15-unknown-fields --only=json,own` | SAFE-STACKED | Rows are found by file and field. The gate baseline has file, code and message (`:113`). An unattributed new diagnostic stops the gate and keeps the edits (`:185` "if (!drop.size) break;") |
| W8 `--responders` | **NEEDS-GREEN** | It writes contracts from checker types: `responder-data.cjs:52` "type: chk.getTypeAtLocation(node)", and `:105` copies brand texts into the generated schema. `any` becomes a leftover (`:79`). A type that is wrong but valid would be baked into a permanent contract |
| W9 `b15-dead-reparse` | **NEEDS-GREEN** | It removes a runtime parse when a type says it is dead: `:486` "c.isTypeAssignableTo(at, rt)" |

No script aborts on existing diagnostics. The gated ones (W1, W7, W8) compare against a baseline read from disk, so a red tree
makes them more conservative. W5 and W6 then leave more leftovers; the id-brands script writes the same edits either way.

## Hand pre-steps

| ID | Before | What | Can it go to the fixer queue instead? |
|---|---|---|---|
| H1 | W3 | `QuestWorkItemId` groups with orchestrator's `WorkItemId`, and the owner keeps shared's `z.uuid()`. `packages/orchestrator/src/contracts/work-item-id/work-item-id.stub.ts`: set the default `'work-item-0'` to a uuid. `.../work-item-id-contract.test.ts`: make its 2 non-uuid literals uuids. Nothing else in orchestrator stubs a non-uuid `WorkItemId` (scanned) | No. After W3 those values fail a parse at run time, which a typecheck-driven fixer never sees |
| H2 | W3 | `PieceId`'s owner is orchestrator's `workPlanPieceContract`, and shared (`work-item.pieceId`, `quest-projection.pieceId`) cannot import it. The dry run shows `noImportPath: 4` | Yes. It is held out of `w3-runs.txt` (fan-out 3); do it after green. To run it instead: move `work-plan-piece` to shared (with `recipeId`), edit the 2.2 `PieceId` row's owner path in `items/b15-brand-migration.md` (the script reads that table), then `--brand=PieceId` |
| H3 | W4 | `ToolUseId`'s owner is a rename of shared's `tool-use-block-param-contract.ts` to `tool-use/tool-use-contract.ts`. The script throws for the orchestrator row (`:62` "do the rename first"). `--pkg=hydration-recipes` would create a second, duplicate owner | Yes. It is held out of `w4-runs.txt` (fan-out 71); do the rename and the run after green |
| H4 | W4 | New owners (`agent`, `siege-instance`, `siege-run`, `session`) get only `id`. Table 2.4 names their other fields | Yes, after green (these create no type errors) |
| H5 | W2 | The lifts: `packageJson` (lift and reconcile; testing's copy goes), `signalBackInput` (lift and reconcile), `packageJsonRaw` (a plain lift). `recipeManifest` and both `zodIssueError` copies are already gone. Hand-rename type `GetQuestInput` to `McpGetQuestInput` (the batch refuses it, because the text is in a brand string). Rename the folders and files of all nine renamed contracts | Yes, all of it. None of it is a type error; R9 and structure lint flag it at W10. Do the folder renames after W8, which finds rows by path |
| H6 | W1 | 17 NOT PLAIN YET rows (table 2.8). Move each production check to the boundary first, then plain them | Yes. They stay standalone until then |
| H8 | W4 | `SmoketestRunId`'s owner field is in orchestrator (`activeSmoketestRun.runId`), and 3 shared references cannot import it (`noImportPath: 3`, `b15-id-brands/run.cjs:203` returns no specifier without a dependency). The script still rewrites them, so they fail typecheck | Yes. The 3 references are listed in its leftovers file |
| H7 | W8 | 11 `gateway` rows (schemas to create), `own` rows whose target is in orchestrator (rows 46, 47, 72: orchestrator has no `./contracts` export or `src/contracts/contracts.ts`), rows 71 and 75 (contracts to create) | Yes. They are listed in `out/leftovers.json` |

## EPIC items not done yet, and whether they block

| Item | Blocks | Notes |
|---|---|---|
| R7-f, R7-g (register `require-object-contract-brands-indexed`) | Nothing | `brand-fix.config.js` loads the broker straight from source. The dry run on hooks and session-forensics gave 78 fixable leaves |
| F100 (R8 nested-object and inline-enum checks) | Nothing | No script reads R8. SD12 carries its own retype. R8 matters only at W10 |
| testing's R1 quiet wave (K-test-1/2, R1-testing-a to -c) | Nothing | W1 (11 testing brands) and W6 (26 testing contracts) edit the same files. Run it before step 1 while the tree is green, or after green |
| B17 remainder (orchestrator, hooks, server, eslint-plugin batches; rule batches) | Nothing | `b17-json-parse` gates per file; run it after green |
| B03 `./contracts` for orchestrator | W8 rows 46, 47, 72 only | Also any W5/W6 owner in orchestrator used from mcp, server or web. The script writes those to leftovers (`noImport`), never a broken import |

## Dry runs on today's tree (2026-09-29, read-only)

Outputs are in `tmp/bigbang/planner/`. Every run is `--leftovers` pointed there. The one run that overwrote a `tmp/phase34/.../out` folder had it restored afterwards.

| Script | Result | Time / peak RSS |
|---|---|---|
| id-brands `--stats-only`, all 30 rows | 28 resolve. `ProcessId` throws "decided plain". `ToolUseId --pkg=orchestrator` throws "do the rename first". `PieceId` `noImportPath` 4, `SmoketestRunId` 3, `QuestId` `localOwnerName` 21, `GuildId` 5 | <2 s / 0.17 GB each |
| id-brands `InstanceId`, full | retype 188 users, 99 files, 0 new diagnostics | 290 s / 4.97 GB |
| W1 `functionName` | 39 accepted, 4 restored, 1 new diagnostic (dangling stub import) | 14 s / 1.5 GB |
| W1 `baseName`, unpatched / P1a | 49 accepted, 361 restored, 77 new / 350 accepted, 60 restored, 8 new | 347 s / 292 s, 12.7 GB |
| W1 `headerText` | its file is gone (10 of 141 rows in table 2.8 are gone) | — |
| SD12, unpatched / P4a | 1,781 to 1,266 / 1,781 to 83. Leftovers: QuestFolder 50, WardResultId 15, other 18 | 274 s, 6.3 GB / 332 s, 7.5 GB |
| W2 batch, unpatched / P6 | crash / 25 of 27 renames resolve, 489 same-text leftovers. Refused: `FolderConfig` (no such type) and `GetQuestInput` | 2 s / 18 s, 1.4 GB |
| W5 `errorMessage` | 9 new, then 1 after the rewriter | 279 s / 4.5 GB |
| W6 `--census` | 558 unbranded contracts (548 object, 10 derived) | <1 s |
| W6 `--only-pkg=cli` / `web` | 0 new / 6 to 4 | 20 s, 1.7 GB / 53 s, 3.3 GB |
| W7, unpatched / P5 | 206 found. Generated 66 (69 gate-dropped) / 118 (17 gate-dropped). 88 leftovers | 301 s / 337 s, 2.7 GB |
| W8 `--no-gate` | 71 of 107 rows located and rewritten in 58 files. 24 "file gone" (L2/L4 deleted those contracts) | <1 s |
| R2 via `brand-fix.config.js`, cli | 32 hits, 23 fixable (matches `ward scan`) | 4 s |

Not dry-run (over the 20 GB limit or over 10 minutes): W6 whole (40 GB heap), W8 with gate (32 GB heap), a whole W5 top-five
trial other than `errorMessage` (`filePath` about 15 min). Run W6 once with the dry form before 8a if the machine is free: it
takes about 17 minutes.

## After the last step

1. `npm run ward -- --only typecheck` per package, leaves first up the import graph. That is the fixer queue.
2. The leftovers files, per wave: W1 logs, `b15-id-brands/out/*-leftovers.json`, `tmp/bigbang/logs/sd12-leftovers.txt`,
   `b15-value-brands/out/*-leftovers.json`, `b12-object-brand-fallout/out/leftovers.json`,
   `b14-shape-contracts/out/leftovers.txt`, `b15-unknown-fields/out/leftovers.json`.
3. Run unit tests before calling a package green. SD12, W5, W6 and W7 add runtime parses (`OwnerStub(...)` and
   `ownerContract.parse(...)`) that typecheck cannot judge.
4. Once green: H2 to H7, then W8 `--responders`, then W9 (`node --max-old-space-size=32000 tmp/phase34/b15-dead-reparse/run.cjs`),
   then W10.
