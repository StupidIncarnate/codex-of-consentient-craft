# Workflow parallelizer — evidence and direction

**Status: measurement complete, direction chosen.** Every question this doc opened has been measured or explicitly
marked open. It exists so a plan can be written against evidence rather than belief.

**The question it was written to serve.** Ward takes about 20 minutes for a full run, and several kinds of session need
to run it at once without corrupting each other. How do we set ward up for those callers, and what inside ward can be
made faster.

**That question contained a wrong premise, and correcting it is the doc's largest finding.**
Concurrent ward runs do **not** corrupt each other — about 30 concurrent runs across four adversarial shapes produced
zero corruption (E11). The real defect is **staleness**: today's configuration reports
`PASS` against source it has never seen, reproducibly, in two commands (E4c). Read the rest with that substitution in
mind — where the repo says *corruption*, the evidence says *silent stale green*.

## If you are here to plan, read in this order

| Read                                | For                                                                                              |
|-------------------------------------|--------------------------------------------------------------------------------------------------|
| 1. **§J** — the direction           | Five pivots, what each perspective gets, the sequencing, and what is deliberately not being done |
| 2. **§K** — the regression contract | Everything ward must still do afterwards, enumerated from source. This is the pass/fail bar      |
| 3. **§J3** — how we know it worked  | The success measure, in two halves: nothing regressed, and five things newly hold                |
| 4. **§G** — questions               | The open ones come first. A plan has to decide or accept each                                    |
| 5. **§C** — the six perspectives    | The constraints the direction is answering. Read if a pivot's reasoning seems arbitrary          |

**Only if you want to check a number:** §A is the mechanism, §B is where the time goes, §E is every experiment with its
script named, §D is what the git history does and does not explain.

**Skip §H.** It is an early draft of the direction, kept only because §E's corrections are easier to follow with it in
view. **Where §H and anything later disagree, the later text wins.**

## Two things that will mislead you if you miss them

**1. Do not quote a number without reading the box above it.** §B, E4d, E7, E10 and H4 carry
`CORRECTED` boxes. A reviewer reading this doc fresh found fourteen places where it drew a conclusion its own evidence
did not support; four were verified before being accepted. **The corrections change which levers matter** — most
importantly, §B's headline figures are one package's numbers, not the repo's.

**2. Nothing in the direction may key on a package name.** This repo resolves e2e eligibility "from
`packageType` signals, never a package name", and the same rule binds everything here: which packages share a typecheck
program, which get a bundle, where that bundle lives. A consumer repo may have no UI package or three, and none called
`web`. Where this doc names `packages/web`, it is citing evidence about this repo, never defining behaviour.

## How to read the evidence marks

| Mark            | Means                                                |
|-----------------|------------------------------------------------------|
| **[measured]**  | Run in this repo, with the script named              |
| **[source]**    | Read out of repo code or config, file and line given |
| **[anecdotal]** | Reported by another session, not reproduced here     |
| **[open]**      | Nobody has established it either way                 |

Anecdotal claims stay because they point at things worth checking. They do not carry the same weight as measured rows
and are never averaged with them.

## Decisions already taken

These are settled. Everything else in this doc is evidence, not a decision.

| #  | Decision                                                                                                                                                              | Evidence                 |
|----|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------|
| D1 | **`--detectOpenHandles` stays.** The LLM misses real leaks without it, so every jest lever that depends on dropping it is off the table.                              | Owner's call             |
| D2 | **Caches and build output go in folders that are not committed.** No `.d.ts` next to source.                                                                          | Owner's call             |
| D3 | **A worktree gets its `node_modules` by HARDLINK (`cp -al`), not by symlink and not by full copy.**                                                                   | E6                       |
| D4 | **Ward stops building anything, and that loss is accepted.** Typecheck becomes `--noEmit`. `npm run build` remains a separate command that someone runs deliberately. | Owner's call, on Pivot 2 |

**D4 is the one capability the pivot removes**, so it is stated as a decision rather than left implied. Everything else
ward does today must survive — the subcommands, every flag and every rejected flag combination, every check type's
pass/fail/skip verdict, the scoping behaviour, and the edge-case verdicts this repo depends on. **§K is that contract**,
enumerated from source rather than from memory.

**What D3 buys, and what it costs.** 0.65s setup and 20.4 MB per worktree. A package installed in a worktree stays
there. A version upgrade landing in the main checkout does **not** reach an existing worktree — it keeps its own modules
until it merges the main checkout in. And because `.bin` becomes a real directory rather than a symlink to the main
checkout's, the worktree runs **its own**
`dungeonmaster-ward` and hooks, closing C6a. The one open risk is a tool that writes **in place**
inside `node_modules` (G15), and the one limit is that `cp -al` cannot cross filesystems.

**The 948 MB of orphaned `.vite-<port>` caches in E6a is not a task here** — cleanup for those lives elsewhere in the
repo. It is recorded only because any copy strategy must exclude them and because it inflates every `node_modules` size
figure.

---

## A. The mechanism: who reads `dist/`, who writes it

`dist/` is each package's compiled output directory. It is the shared mutable thing every parallelization problem in
this repo runs into.

### A1. Ward's typecheck is a build

In multi-package mode `command-run-broker` runs `checkCommandsStatics.typecheckRefs`, which is
`tsc -b --listFiles` from the repo root **[source: `check-commands-statics.ts:55-59`;
`command-run-broker.ts:149`]**. `tsc -b` is build mode. It emits into every package's `outDir` and writes a
`.tsbuildinfo`.

The per-package fallback (`tsc --noEmit`) is reached when `projectReferencesSyncBroker` reports a reference cycle
**[source: `command-run-broker.ts:121-127`]**, and also for any package that is not composite-eligible — see A7.

### A2. Adding project references is what made typecheck need a build

Built the orchestrator's real `tsconfig.json` program twice and counted where its shared files came from **[measured:
`tmp/program-probe2.cjs`]**:

| Program shape                                 | shared `src/**/*.ts` | shared `dist/**/*.d.ts` |
|-----------------------------------------------|----------------------|-------------------------|
| `projectReferences` **on** — today            | **0**                | **689**                 |
| `projectReferences` **off** — pre-pivot shape | **746**              | **0**                   |

Before commit `99fbf9984` no package set `composite: true` and the root `tsconfig.json` had no
`references` — it globbed `packages/*/src/**/*` **[source: `git show 99fbf9984^:tsconfig.json`]**. Under
`moduleResolution: "node"`, `@dungeonmaster/shared/contracts` resolves to `packages/shared/contracts.ts`, the source
barrel, because node10 ignores the `exports` map **[measured: `tmp/resolve-probe.cjs`]**.

With `composite` plus `references`, a source file belonging to a referenced project is consumed through that project's
emitted `.d.ts` instead. Standard TypeScript behaviour, not a misconfiguration.

### A3. Jest reads `dist`, and always did

Resolved through jest's own resolver using each package's real config **[measured: `tmp/jest-resolve-probe.cjs`]**:

| Package                        | `@dungeonmaster/shared/statics` resolves to |
|--------------------------------|---------------------------------------------|
| orchestrator                   | `packages/shared/dist/statics.js`           |
| server                         | `packages/shared/dist/statics.js`           |
| node `require`, same condition | `packages/shared/dist/statics.js`           |

The `exports` map already carried `require: "./dist/statics.js"` before the pivot **[source:
`git show 99fbf9984^:packages/shared/package.json`]**. **The stale-`dist` symptom in unit tests predates the
project-references change.**

### A4. What that makes of the original fix

The recollection is that a change in `shared` gave bad ward results until you built, and that this is why the build got
baked in. The measurements say the broken check was **jest**, and the check that got the fix was **typecheck**.

1. jest read `dist`, so a shared edit gave stale unit results.
2. The fix made typecheck a build.
3. A full ward run now refreshes `dist` as a side effect, so the jest staleness disappears.

The repair works, by side effect, through a different check than the one that was broken.

**That is the parallelization problem in one line: refreshing `dist` is welded to a check, and that check is the one
thing two sessions cannot run at once.**

It also explains the unsatisfiable brief. `--only lint,test` excludes the only check that writes
`dist` and includes the checks that read it, which is why report 13's agent could not turn its test green and report
05's agent hand-edited `shared/dist/testing.js` **[source: post-mortem §E3, §E31]**.

### A5. Summary table

| Check              | Reads `dist`?                                                                       | Writes `dist`? | Basis                 |
|--------------------|-------------------------------------------------------------------------------------|----------------|-----------------------|
| lint               | **Yes**, except in `web`                                                            | No             | **[measured]** A8     |
| typecheck          | Yes, except in `web`                                                                | **Yes**        | **[measured]** A2, A7 |
| unit / integration | Yes                                                                                 | No             | **[measured]** A3     |
| e2e                | **Yes, narrowly** — `shared/dist` and `testing/dist`, through the test tooling only | No             | **[measured]** E5     |

### A6. `tsc -b` emits test files that `npm run build` deliberately excludes

`packages/cli/tsconfig.build.json` excludes `**/*.test.ts`. `packages/cli/tsconfig.json` includes
`test/**/*`. The root solution tsconfig references `./packages/cli`, which resolves to the tests-included one. So
`tsc -b` emits cli's tests and `npm run build` does not **[source]**.

`packages/cli/dist` **[measured]**: newest non-test `.js` written 2026-09-05 21:19; newest test `.js`
written 17:57. The 21:19 build neither wrote nor removed the test output.

**This is a shipping defect, not a tidiness one, and the original wording understated it.** `cli/dist`
holds **79 test, proxy and stub `.js` files against 50 real ones — more than half the published output** — and `cli`
publishes `files: ["dist/**/*"]`. **So a quality tool, run by a consumer, puts test code inside the published
`dungeonmaster` package.** That is an argument for H2 that owes nothing to speed or concurrency.

Commit `1fcf031ff` (2026-08-15) predicted this while declining `tsc -b` for `npm run build`:

> *"it drives each package's tsconfig.json, and cli/eslint-plugin deliberately build through a
> narrower tsconfig.build.json that excludes tests. Build mode would emit test files into the
> published dist and skip every non-tsc step besides…"*

Do not use `packages/eslint-plugin` as a parallel example. Its `tsconfig.build.json` excludes only three integration
tests.

### A7. `packages/web` already does the source-based thing, in production, today

`web` sets `noEmit: true`, and `isCompositeEligible` is `tsconfig exists && noEmit !== true`
**[source: `workspace-input-build-layer-broker.ts`]**. So `web` never enters `tsc -b`, is absent from the root
`references` list, and takes the per-package `tsc --noEmit` path.

`web` has **zero** project references, so node10 resolution gives it source **[measured: `tmp/web-program-probe.cjs`]**:

|                                    |         |
|------------------------------------|---------|
| program files                      | 3,724   |
| shared `src/**/*.ts` in program    | **746** |
| shared `dist/**/*.d.ts` in program | **0**   |
| program construction               | 1.8s    |
| diagnostics                        | 8.0s    |
| **errors**                         | **0**   |

**The largest package in the repo already typechecks against source, needs no build, and is green.**
That is the strongest single piece of evidence that the source-based direction works here.

**Why `web` is not composite: it was never converted, and the omission happens to be right.** Its tsconfig predates the
pivot and `99fbf9984`'s 605-file diff never touched it **[source:
`git show --stat 99fbf9984 -- packages/web/tsconfig.json` is empty]**. `noEmit: true` and
`isolatedModules: true` were already there. Three things make leaving it alone correct rather than lucky:

1. **Vite builds it, not tsc.** `"build": "vite build"` **[source]**. tsc is a pure type checker there, which is the
   standard Vite setup, and `noEmit: true` is what that setup calls for.
2. **Nothing imports TypeScript from it.** `server` does depend on `@dungeonmaster/web`, but only to
   `require.resolve('@dungeonmaster/web/package.json')` and serve files out of its `dist/` as static assets **[source:
   `web-bundle-dist-path-adapter.ts`]**. `web` publishes no `exports`, no `main`, no `types`.
3. **`composite` exists so downstream projects can consume your emitted `.d.ts`.** With no emit and no consumer, it buys
   nothing. TypeScript 5.8 does accept `composite` alongside `noEmit` at config parse **[measured]**, so this is a
   semantic point rather than a hard block.

**So `web` is the control group.** It shows what this repo looks like without the conversion. And it proves the half
that matters: `web` is the *consumer* and `shared` is the *dependency*, so a package CAN be consumed from source by a
green typecheck. What `web` cannot prove on its own is the other half — it is a leaf, so it never has to expose types to
anyone.

### A8. Typed lint reads `dist`, settled by the host that typed lint actually uses

`@typescript-eslint/typescript-estree` builds its program through TypeScript's **watch** API
(`create-program/getWatchProgramsForProjects.js`) and never passes `projectReferences` itself **[source]**. That
matters, because a watch host implements the project-reference redirect that a plain `ts.createCompilerHost` does not —
so an earlier probe of mine could not have answered this.

Rebuilt the program the same way typed lint does **[measured: `tmp/lint-program-probe.cjs`]**:

| Package         | references | program files | shared `src/*.ts` | shared `dist/*.d.ts` |
|-----------------|------------|---------------|-------------------|----------------------|
| orchestrator    | 3          | 2,633         | **0**             | **689**              |
| server          | —          | 1,857         | **0**             | **687**              |
| `web` (control) | **0**      | 3,724         | **746**           | **0**                |

Same tool, same host, opposite result. **The project references are the sole cause.** Lint depends on
`dist` everywhere except `web`, which confirms the delivery-chain audit's table and closes G1.

Two things follow. A stale `dist` gives wrong type-aware lint verdicts, silently. And any eslint
`--cache` must key on `dist` state as well as rule code, or it caches those wrong verdicts.

### A9. Not every package can reach source, even with references gone

TypeScript under `moduleResolution: "node"` (node10) ignores the `exports` map. It reaches source only when a **root
`<subpath>.ts` barrel file physically exists**; otherwise it falls back to `main`/`types`, which point into `dist`. Jest
is different — it honours `exports`, so a `source` condition can point anywhere, including `./src/index.ts`.

| Package                    | root `.ts` barrels | `source` condition     | TypeScript reaches                         | Jest can reach |
|----------------------------|--------------------|------------------------|--------------------------------------------|----------------|
| shared                     | 10                 | yes                    | source                                     | source         |
| session-forensics          | 6                  | yes                    | source                                     | source         |
| mcp                        | 2                  | yes                    | source                                     | source         |
| orchestrator               | 1                  | yes                    | source (`./testing`), **dist** (bare name) | source         |
| config                     | 1                  | yes                    | source                                     | source         |
| **testing**                | **0**              | yes → `./src/index.ts` | **dist**                                   | source         |
| **eslint-plugin**          | 0                  | **no**                 | **dist**                                   | dist           |
| local-eslint, tooling, cli | 0                  | yes                    | **dist**                                   | source         |
| hooks, server, ward, web   | 0                  | no exports map         | n/a — nothing imports them                 | n/a            |

The `web` probe shows this live: 746 shared **source** files alongside 50 `@dungeonmaster/testing`
**dist** `.d.ts` files, in the same program **[measured]**.

**So "drop the references" is not sufficient on its own.** Either add root barrels to `testing` and
`eslint-plugin`, or add a `paths` mapping for `@dungeonmaster/*` in the base tsconfig, which node10 does honour and
which covers every package in one entry. The `paths` route looks cheaper and is probably the better mechanism for H2.

---

## B. Where the time goes

> **CORRECTED. The original version of this section was wrong in two ways that propagated through the
> whole document, and the corrections were found by a reviewer reading it fresh. Read this box before
> any number below.**
>
> **Correction 1 — the headline run is the worst of fifteen, not a typical one.** Across every full
> unscoped run on record **[measured]**:
>
> | | min | **median** | max | the run §B originally quoted |
> |---|---|---|---|---|
> | total | 83s | **613s (10.2 min)** | 1240s | 1239.9s |
> | e2e | 14s | **248s** | 415s | 415.5s |
> | unit | 13s | **90s** | 304s | 304.2s |
> | integration | 31s | **54s** | 71s | 70.8s |
> | lint | 16s | **56s** | 95s | 67.3s |
> | typecheck | 7s | **8s** | 11s | 9.2s |
>
> `run-1788668405092-d62c.json` is the maximum in five of six columns. **"Ward takes about 20 minutes"
> overstates the median by 2×.**
>
> **Correction 2 — every per-check number is ONE package's duration, and in that run all of them are
> `packages/web`'s.** `command-run-layer-multi-broker.ts:209` aggregates with
> `Math.max(0, ...bucket.map(c => c.durationMs))`. `packages/web/.ward/run-1788668832918-611e.json`
> carries `typecheck 9181`, `unit 304200`, `e2e 415482` — **byte-identical to the parent's three
> figures**, in a child job totalling 811.7s **[measured]**.
>
> So the cost is not spread across fourteen packages. **`packages/web`'s single serial child job is
> the floor of every full run**, and no amount of cross-package concurrency can go below it. That
> reorders which levers matter, and §J is written against the corrected picture.

The originally-quoted run, kept because later sections cite its per-package detail:

| Check         | Reported duration (this run) |
|---------------|------------------------------|
| e2e           | 415.5s                       |
| unit          | 304.2s                       |
| integration   | 70.8s                        |
| lint          | 67.3s                        |
| typecheck     | 9.2s                         |
| **run total** | **1239.9s**                  |

The five checks sum to 867s against a 1239.9s total, which is the first visible symptom of correction 2: they are
maxima, not addends.

### B1. Ward already runs four packages at once

`CONCURRENCY_LIMIT = 4`, hardcoded, feeding `promisePoolTransformer`
**[source: `command-run-layer-multi-broker.ts:73-80`]**. Each slot spawns a full child ward process. Nothing reads this
from config or from CPU count.

**This is the lever the `--detectOpenHandles` constraint leaves standing.** Jest is serial *inside* a package; ward is
4-wide *across* packages. **Measured in E12: raising it to 8 saves 40s and to 12 saves 55s, at 41% and 62% more
memory.**

### B2. Startup cost is real; the obvious method for isolating it does not work

`ProjectResult` has no `durationMs` field — only `fileTimings` per file **[source]**. So a saved run cannot say which
package was slow.

Deriving startup as `check wall clock − sum(fileTimings)` produces negative numbers, because packages run concurrently
and tool-reported per-file times overlap. **That method does not work.** Recorded so nobody repeats it.

Relative lint rule cost per package, from the per-file sums **[measured]**:

| Package           | eslint per-file rule time | files |
|-------------------|---------------------------|-------|
| orchestrator      | 60.7s                     | 1448  |
| web               | 53.4s                     | 1280  |
| shared            | 40.7s                     | 1518  |
| eslint-plugin     | 23.1s                     | 595   |
| server            | 21.0s                     | 574   |
| mcp               | 20.3s                     | 559   |
| ward              | 17.7s                     | 451   |
| hooks             | 17.1s                     | 403   |
| testing           | 8.5s                      | 313   |
| session-forensics | 8.1s                      | 113   |
| cli               | 7.5s                      | 125   |
| config            | 7.1s                      | 98    |
| local-eslint      | 4.8s                      | 57    |
| tooling           | 4.1s                      | 78    |

### B3. Jest is forced single-threaded, and that is now a fixed constraint

Ward passes `--detectOpenHandles` **[source: `check-commands-statics.ts:66`]**. Jest's
`shouldRunInBand` returns true whenever it is set — its comment reads *"detectOpenHandles makes no sense without
runInBand, because it cannot detect leaks in workers"* **[source: `@jest/core`]**.

The repo owner has ruled that the flag stays (D1). So unit's 304s cannot be attacked by adding jest workers. Only B1 and
per-file transform cost remain.

**And lifting D1 would not be enough anyway.** E4d found that ward passes `--runInBand` **directly and unconditionally**
as well **[source: `check-run-unit-broker.ts:161`]**, so jest would stay serial even without `--detectOpenHandles`. Both
would have to go.

### B4. Cache state, per tool

| Tool   | Cached?                           | Evidence                                                                                             |
|--------|-----------------------------------|------------------------------------------------------------------------------------------------------|
| jest   | **Yes, and it carries the suite** | `/tmp/jest_rt` holds 2.2 GB across 306,709 files **[measured]**                                      |
| tsc    | **Yes**                           | Every package tsconfig sets `incremental: true`, `tsBuildInfoFile: ./dist/.tsbuildinfo` **[source]** |
| eslint | **No**                            | No `--cache` anywhere in ward **[source]**                                                           |

Two consequences of the tsc setup:

1. The buildinfo lives **inside** `dist/`, so `build:clean`'s `rm -rf packages/*/dist` throws away the incremental state
   along with the output **[source]**.
2. The buildinfo is the file two concurrent `tsc -b` runs would fight over, and it is where the repo's corruption
   doctrine points. **E11 tested that directly and found no corruption in about 30 concurrent runs.** Treat it as a
   theoretical contention point, not an observed failure.

### B5. ESLint cache, measured

Added `--cache --cache-strategy content --cache-location <pkg>/.ward/eslint-cache` and ran
`packages/ward` (451 files) **[measured]**. The edit has since been reverted.

| Run                      | Wall clock |
|--------------------------|------------|
| No cache (baseline)      | 14.7s      |
| Cold — writing the cache | 18.5s      |
| Warm                     | 6.5s       |

Warm is 2.3× faster. A cold or busted cache costs 26% **more** than not caching at all. Cache file was 9.8 MB for one
package.

**The soundness problem.** ESLint's cache key is the file's own content plus a JSON serialization of the resolved
config. `json-stable-stringify-without-jsonify` drops functions, so **rule implementations are not in the key**
**[source: `eslint/lib/cli-engine/lint-result-cache.js:46-55`]**.
`eslint.config.js:10` loads this repo's rules from TypeScript source through `ts-node`. Edit a rule and every skipped
file keeps its old verdict. Any cache here needs a key covering rule code and type inputs, or it produces silent green.

### B6. The eslint config compiles two plugin packages through ts-node

Reported at about 3 seconds per eslint process, reaching every Edit hook and every session **[anecdotal]**. **Timed in
E9 and the anecdote was right: 3.6s per process, 3.24s of it compiling
`eslint-plugin` and `local-eslint` from TypeScript source.**

---

## C. The six perspectives to solve for

### C1. A single agent running parallel sub-agents on one branch

Sub-agents share one working tree. Each needs to verify its own work without clobbering a sibling. The orchestrating
agent then runs a broader `--changed` ward over the union.

**The bind:** that broad run needs a build first, because of A1 and A3, unless something changes.

### C2. The orchestrator package running a flow of LLMs — three layers

| Layer | Who runs ward                              | What they run                                                     |
|-------|--------------------------------------------|-------------------------------------------------------------------|
| 1     | The orchestrator itself                    | `--changed` between work items, full ward before the quest closes |
| 2     | A `child_spawn`ed LLM given one chunk      | its reviewer runs ward                                            |
| 3     | Sub-agents launched from inside that child | **where the post-mortems measured the real pummelling**           |

Layer 3 produced the 158 counted `npm run build` invocations, 34 in a single work item **[source: post-mortem §E3]**.

### C3. A worktree per sub-agent

Priced end to end **[measured]**:

| Step                                          | Time                                           |
|-----------------------------------------------|------------------------------------------------|
| `git worktree add`                            | 0.32s                                          |
| symlink root `node_modules` (695 links)       | 0.02s                                          |
| symlink per-package `node_modules` (57 links) | negligible                                     |
| **cold `npm run build`**                      | **55.1s, 60.7s, 71.3s** across three worktrees |
| warm rebuild, nothing changed                 | 30.0s                                          |

**So a usable worktree costs roughly a minute today, and 99% of it is the build.** The three cold figures are three
separate worktrees built back to back; the spread is machine noise, not a difference between them.

**There is a second, larger cost nobody had counted, and E12a found it: a fresh worktree also starts with a COLD jest
transform cache, worth about 350s on its first full unit run.** Jest keys on absolute file paths, so a new worktree
inherits none of the main checkout's 2.2 GB cache. That dwarfs both the setup and the build.

Sizes **[measured]**: main checkout `node_modules` is 486 MB; a worktree's is 2.9 MB, because it is 537 top-level
symlinks into the main checkout plus real `@dungeonmaster/*` symlinks pointing at the worktree's own `packages/`.
`eslint`, `jest`, `tsc` and `playwright` shims are all present in the worktree `.bin`.

**Each worktree gets its own `dist/`,** because `@dungeonmaster/*` points at worktree-local packages. All four
pre-existing worktrees have `packages/shared/dist`.

**Two traps for anyone writing the setup script. The second one is the dangerous one.**

*Trap 1 — root `node_modules` is not enough.* Seven packages have their own `node_modules`, and
`packages/web/node_modules/react-router-dom` is one of them. A worktree missing those fails the build at `vite build`
with *"Rollup failed to resolve import react-router-dom"* **[measured — I hit it]**.

*Trap 2 — a naive symlink populates a worktree that silently grades the WRONG TREE.* Copying the main checkout's
`node_modules` entry by entry carries its `@dungeonmaster/x -> ../../packages/x` links across **by absolute path**, so
inside the worktree they resolve back into the main checkout. The worktree then builds the main checkout's code and ward
grades it. The run is green and measures nothing you changed. `tmp/pm-worktree-setup.sh` carries this lesson in its own
comments and re-points every `@dungeonmaster/*` link at the worktree's own `packages/` afterwards.

Use `tmp/pm-worktree-setup.sh` or `worktreePopulateNodeModulesBroker` rather than writing a third implementation. Both
handle both traps. I hit trap 1 by hand-rolling and had to redo the measurement.

**Both of those scripts symlink, and D3 replaces that with hardlinking.** The traps do not go away —
`.vite-*` must still be excluded and `@dungeonmaster/*` must still be re-pointed — but a third trap disappears, because
a real `.bin` directory stops the worktree borrowing the main checkout's binaries. E6 has the measurements and E6e names
what has to change.

**The lock is real.** The 537 symlinks point into the main checkout, so an `npm install` there swaps files underneath
every live worktree.

### C4. Dogfooding ward on ward

Ward changes have to be exercised somewhere, but the repo also wants "ward is stable" runs against the main checkout's
`node_modules`. The tool under test is the tool grading the test. Nothing established yet. **[open]**

### C5. Dungeonmaster published, running ward in someone else's repo

**Question: does a consumer repo inherit the same hammering?**

**Answer: a workspace monorepo does, and ward CREATES the condition rather than inheriting it. A single-package repo is
exempt.**

The gate is `isProjectReferencesModeGuard`, and its bar is low **[source]**:

```
rootHasWorkspaces === true  AND  at least one workspace package is "composite-eligible"
```

`isCompositeEligible` is only `tsconfig.json parses && compilerOptions.noEmit !== true`
**[source: `workspace-input-build-layer-broker.ts`]**. **Nothing requires the consumer to have set up
`composite` or `references` themselves.** Almost any TypeScript npm-workspaces repo qualifies.

Once it qualifies, `projectReferencesSyncBroker` runs with `ensureComposite: true` for every eligible package and
`checkOnly` never set, so it **writes** **[source: `project-references-sync-broker.ts:76`,
`command-run-broker.ts:116`]**.

Driven against a throwaway two-package consumer repo in `/tmp`, using ward's own built code **[measured]**:

| File                             | Before                                 | After one sync                                                                 |
|----------------------------------|----------------------------------------|--------------------------------------------------------------------------------|
| `packages/app/tsconfig.json`     | plain, no `composite`, no `references` | `"composite": true` inserted, `"references": []` added, whole file reformatted |
| `tsconfig.json` at the repo root | **did not exist**                      | **created**, containing a `references` array                                   |
| `packages/core/tsconfig.json`    | has `//` and `/* */` comments          | **untouched — and silently dropped from the graph**                            |

Ward announces all of it with a single stderr line: `ward: synced project references in 2 tsconfig(s)`.

Three consequences, in descending order of how much they would annoy a stranger:

1. **A quality-check tool rewrites their source config and creates files they did not ask for.** The root
   `tsconfig.json` is created from nothing. Package configs gain `composite: true` and are reformatted by
   `JSON.stringify(…, 2)`, so hand formatting is lost.
2. **That rewrite is what gives them the `dist` dependency (A2), which is what gives them the hammering.** Their
   typecheck becomes `tsc -b`, a build; their lint and jest start reading `dist`; and two agents running ward at once
   now corrupt each other. **They did not have this problem before ward arrived.**
3. **A tsconfig with comments makes its PACKAGE silently ineligible — but DESTROYS their ROOT config.**
   `readTsconfigSafeLayerBroker` uses plain `JSON.parse`, which rejects the JSONC that `tsc --init`
   itself generates **[source: `fs-read-json-sync-adapter.ts`]**. For a *package* config the parse failure makes it
   non-eligible, so it is skipped — safe. **For the ROOT config there is no eligibility test.**
   `project-references-sync-broker.ts:80-89` falls back to
   `?? tsconfigJsonWritableContract.parse({})` and then writes `JSON.stringify(updated, null, 2)`.

   > **CORRECTED — my first experiment missed this because its fake repo had no root tsconfig, so it
   > only observed creation. Re-run with a commented root config [measured]:**
   >
   > | | |
      > |---|---|
   > | **before** | `{ // Root config…  "compilerOptions": { "strict": true, "target": "ES2022", "paths": {…} } }` |
   > | **after** | `{ "references": [ { "path": "./packages/app" } ] }` |
   >
   > **`strict`, `target` and `paths` are gone.** A published quality tool silently deletes a
   > consumer's root compiler configuration and announces it as one stderr line. This is data loss,
   > not untidiness, and it raises C5 from an annoyance to the most urgent item in the document.

**Single-package consumers are fully exempt.** `workspaceDiscoverBroker` returns `null`, so
`preComputedTypecheck` is never computed and `commandRunLayerSingleBroker` runs a plain
`tsc --noEmit`. No writes, no build, no hammering.

**What this means for the fix.** H2 is worth more here than anywhere else. Making typecheck a pure
`--noEmit` reader removes the need to write to a consumer's tsconfig at all — no `composite`, no
`references`, no root file, no reformatting. The whole `projectReferencesSyncBroker` disappears rather than being made
safer.

### C6. A worktree that changes the instrument — `testing`, `ward`, `hooks`, `eslint-plugin`

**The concrete case: a worktree edits `packages/testing` and needs ward to run the NEW harness, so it can see both
whether the change works and whether it broke anything else.** This is C4's dogfooding question with a mechanism
attached, and it generalises to every package that IS part of the instrument rather than merely graded by it.

#### C6a. A worktree does not run its own binaries. It runs the main checkout's.

`tmp/pm-worktree-setup.sh` re-points `node_modules/@dungeonmaster/*` at the worktree's own packages — that is the trap
it documents. It does **not** re-point `node_modules/.bin`, which it links as a single symlink to the main checkout's
`.bin` directory **[measured]**:

```
worktrees/<any>/node_modules/.bin -> <main checkout>/node_modules/.bin
```

**13 of the 58 binaries there are workspace-owned, and all 13 resolve into the MAIN CHECKOUT's
`packages/*/dist`** **[measured]**:

| Binary                                                   | Resolves to                                     |
|----------------------------------------------------------|-------------------------------------------------|
| `dungeonmaster-ward`                                     | `<main>/packages/ward/dist/bin/ward-entry.js`   |
| `dungeonmaster` (the CLI)                                | `<main>/packages/cli/dist/bin/dungeonmaster.js` |
| 8 × `dungeonmaster-*-hook`                               | `<main>/packages/hooks/dist/src/startup/…`      |
| `dungeonmaster-post-edit-lint`, `dungeonmaster-pre-bash` | same                                            |
| `detect-duplicate-primitives`                            | `<main>/packages/tooling/dist/bin/…`            |

Verified for all three worktrees on disk right now: every one runs `<main>/packages/ward/dist/bin/ward-entry.js`.

**So a worktree that changes `ward`, builds it, and runs `npm run ward` is graded by the OLD ward.**
Same for `hooks`: the hooks that fire in a worktree session are the main checkout's. This is the same class of
silent-wrong-tree failure the setup script already fixes for package resolution, left open for binaries.

It cuts both ways, which is why nobody noticed. For C4's "ward is stable" runs, borrowing the known-good binary is
exactly what you want. For testing a ward change it is exactly what you do not. **Neither was chosen — it falls out of
one `ln -s` of a directory.**

**E6d narrows the cause and gives the fix.** npm's shims are *relative*
(`../@dungeonmaster/ward/dist/bin/ward-entry.js`), so they land wherever `.bin` really lives. Make
`.bin` a real directory in the worktree and the same shim resolves to the worktree's own package. Every strategy except
today's gets this right for free.

It also means **the main checkout's `packages/ward/dist` is a live read dependency of every running worktree.** Rebuild
ward in the main checkout and every worktree picks it up mid-run.

#### C6b. What a `packages/testing` change actually needs built

Not everything in `testing` goes through `dist`, and the split is not obvious **[source]**:

| What you changed                                                                                 | How it is consumed                                                                                      | Build needed? |
|--------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|---------------|
| `src/jest.setup.js`                                                                              | `setupFilesAfterEnv: '<rootDir>/../../packages/testing/src/jest.setup.js'` — a relative **source** path | **No**        |
| `ts-jest/harness-lifecycle-transformer.js`                                                       | `jest.config.base.js` by relative path; requires only npm packages                                      | **No**        |
| `ts-jest/proxy-mock-transformer.js`, the glue itself                                             | same                                                                                                    | **No**        |
| the middleware that file requires — `../dist/src/middleware/typescript-proxy-mock-transformer/…` | hardcoded relative **`dist`** path inside the transformer                                               | **YES**       |
| anything under `src/**` reached as `@dungeonmaster/testing` from a test                          | jest resolver → `dist/src/…`                                                                            | **YES**       |

So a `testing` change is half-live and half-stale until you build, with no signal telling you which half you are in.
**That hardcoded `../dist/` in `proxy-mock-transformer.js` is the third literal
`dist` path found so far**, alongside `packages/web/jest.config.cjs`'s `setupFilesAfterEnv` and the e2e tooling in E5a.
H1's `source` condition does not reach any of the three.

#### C6c. A broken instrument gives a useless signal, not a wrong one

The transformer runs during jest's transform phase, so breaking it fails **every** test file at compile. `registerMock`
is used by every test, so breaking it fails everything. The question the worktree wants answered — *did my change break
something else?* — cannot be read off a suite that is 100% red for a single reason.

That argues for a two-tier run whenever the instrument is what changed, rather than one broad ward:

1. **A canary.** Run the new harness against a handful of tests first, purely to confirm the harness still functions. A
   red canary means the instrument is broken and the broad run would say nothing.
2. **Then the broad run**, where a failure now means a real regression.

Nothing in ward or the prompts expresses this today. **[open]**

#### C6d. What would have to be true

| Need                                            | Today                      | Gap                                                                                                |
|-------------------------------------------------|----------------------------|----------------------------------------------------------------------------------------------------|
| The worktree runs its OWN binaries              | runs the main checkout's   | `.bin` must be re-pointed per worktree for the 13 workspace-owned entries, not symlinked wholesale |
| A `testing` change is live without a build      | half live, half via `dist` | the hardcoded `../dist/` in `proxy-mock-transformer.js`, plus H1 for the rest                      |
| A trustworthy signal when the instrument is red | none                       | the canary tier in C6c                                                                             |
| The main checkout is not a live dependency      | it is, through `.bin`      | same fix as row 1                                                                                  |

---

## D. What the history says

**No recorded reasoning exists for making ward's typecheck a build.**

Every piece arrived in one squash: `99fbf9984`, 2026-05-27, 605 files, *"Refactor: pivot orchestration to
/dumpster-launch monitor session model"*. It introduced `check-run-typecheck-refs-broker`,
`project-references-sync-broker`, the `typecheckRefs` statics entry, and `composite` / `incremental` /
`tsBuildInfoFile` in every package tsconfig. Its message covers slash commands, MCP tools, PathSeeker decomposition,
sub-agent identity and the web UI, and mentions none of them **[source]**.

The only reasoning ever written down is downstream damage control — `packages/ward/CLAUDE.md:280-287`
and `packages/orchestrator/CLAUDE.md:623-630` both explain that typecheck writes, so two at once corrupt `dist`. Both
describe the consequence. Neither says why ward was pointed at build mode.

The one commit that reasons about `tsc -b` argues against it — `1fcf031ff`, quoted in A6.

---

## E. The source-resolution experiments

### E1. Typecheck: one whole-repo source program, incremental

Built a root tsconfig in the pre-pivot shape — `include: packages/*/src/**/*`, `noEmit: true`, no references — and drove
it with TypeScript's semantic-diagnostics builder, the same incremental machinery `tsc --incremental` uses. Buildinfo
written to `tmp/`, outside any committed tree **[measured: `tmp/tsc-source-probe.cjs`,
`tmp/tsc-incremental-probe.cjs`]**.

| Scenario                                            | Files re-checked | Program construction | Check phase | **Total** |
|-----------------------------------------------------|------------------|----------------------|-------------|-----------|
| Cold, no buildinfo                                  | 9,865            | 4.7s                 | 20.9s       | **25.7s** |
| Warm, nothing changed                               | 0                | 4.9s                 | 0.0s        | **5.0s**  |
| One leaf guard edited                               | 3                | 4.8s                 | 0.3s        | **5.3s**  |
| `file-path-contract.ts` edited — used ~1,300 places | 3,772            | 5.7s                 | 17.8s       | **23.6s** |

**A source-based whole-repo typecheck beats today's `tsc -b` on the typical edit — about 5.3s against 9.2s — and emits
nothing.**

Two caveats on those numbers. The program reported 2,367 errors from my hand-rolled root config, not from real type
problems: `web` needs `jsx` and the DOM lib, and `mcp` needs its own
`packages/mcp/@types` in `typeRoots`. A correctly-configured run would differ, in an unknown direction. And `touch`
alone does not invalidate: TypeScript's builder keys on file content, not mtime **[measured]**.

### E2. Only one package diverges on compiler options — and the rule is derived, not named

Surveyed every package's `compilerOptions` **[measured]**. Thirteen of fourteen differ from the base only in `rootDir`,
which is irrelevant under `noEmit`. `web` differs really:

```
web: { "jsx": "react-jsx", "lib": ["ES2022","DOM","DOM.Iterable"], "module": "ESNext" }
```

DOM in the shared lib would let `document` typecheck inside a node package, so that package cannot join one program. Two
programs, not one. It already runs as its own program today (A7).

**Do not turn this into a rule about `packages/web`.** A consumer repo may have no UI package or three, and none named
`web`. The general form is: group packages by the resolved `compilerOptions`
that change what checking *means* — `jsx`, `lib`, `target`, `module`, `moduleResolution`, `types`, the strictness
family — and ignore the emit-only ones, which are irrelevant under `--noEmit` and must not split a group.
`tmp/program-grouping-probe.cjs` runs that derivation and returns this exact 13/1 split with no package name in it
**[measured]**.

### E3. Jest with the `source` export condition

The `exports` map already carries a `source` condition. Resolution with it added **[measured:
`tmp/source-condition-probe.cjs`]**:

| conditions                       | `@dungeonmaster/shared/statics`   |
|----------------------------------|-----------------------------------|
| `["require","default"]` — today  | `packages/shared/dist/statics.js` |
| `["source","require","default"]` | `packages/shared/statics.ts`      |

`transformIgnorePatterns` already excludes `/dist/` and does not exclude `packages/`, so ts-jest picks the source up.

Ran `packages/session-forensics` (40 test files) both ways, each with its own isolated
`cacheDirectory` under `/tmp` **[measured]**:

| Variant                     | Cold      | Warm     | Cache size |
|-----------------------------|-----------|----------|------------|
| A — dist resolution (today) | 16.6s     | 4.9s     | 2.6 MB     |
| B — `source` condition      | **32.0s** | **5.1s** | 14 MB      |

**All 40 tests pass under B.** The proxy-mock AST transformer and `registerMock` survive the switch.

Cold roughly doubles. Warm is unchanged. The cache grows 5.4×.

### E4. The real inner loop, both ways

The comparison that matters is not cold-versus-cold; it is "edit shared, then verify"
**[measured, single sample each]**:

|                               | Today (dist) | Proposed (source) |
|-------------------------------|--------------|-------------------|
| warm baseline                 | 4.8s         | 8.1s              |
| build `shared` after the edit | 3.0s         | **not needed**    |
| run after the edit            | 4.8s         | 8.3s              |
| **total**                     | **7.8s**     | **8.3s**          |

Roughly equal in time. The difference is that the source path never writes `dist`, so it is safe to run concurrently,
and it cannot go stale.

**Treat the individual figures as noisy.** These are single samples on a busy machine; the warm baseline for B measured
5.1s in E3 and 8.1s here.

### E4b. The same experiment on the two biggest packages — the 2× does not hold, it gets better

Run by a sub-agent in its own worktree, interleaved A/B/A/B, with other timing work on the box throughout
**[measured]**. `shared` is 566 test files, `orchestrator` 516 (ward reports 516, not the 517 quoted earlier).

| Package        | Arm        | Cold, per repeat    | Warm, per repeat |
|----------------|------------|---------------------|------------------|
| `shared`       | A baseline | 167.4, 165.6        | 55.7, 53.2       |
| `shared`       | B `source` | 171.4, 160.8        | 54.7, 62.6       |
| `orchestrator` | A baseline | 248.5, 239.2, 288.2 | 63.6, 62.4, 71.6 |
| `orchestrator` | B `source` | 266.9, 295.8, 325.7 | 60.6, 83.1, 73.0 |

**Cold ratio B:A — `shared` 1.00, `orchestrator` 1.13.** Warm ratios are 1.08 and 1.10, inside the noise band. **The 2×
measured on the 40-file package does not survive at scale.** Worst case is +13% cold on the package with the heaviest
cross-package import volume — about 37s on a 259s baseline.
`shared` is free, because it imports almost nothing cross-package, so `source` mostly swaps which copy of a file gets
transformed rather than adding files.

**Every variant passed: 566/566 and 516/516, every repeat, no failures of any kind.** No config had to change beyond the
two added fields.

Cache after warm: `shared` 26 MB → **25 MB** (smaller under B); `orchestrator` 39 MB → 49 MB (+26%). Nowhere near the
5.4× blow-up on the small package.

**Noise calibration, and why the design mattered:** `orchestrator`'s third A cold run (288.2s) came in *higher* than its
first B cold run (266.9s). The contamination band overlaps the effect size, so only the paired interleaved design gives
a usable answer.

### E4c. The inner-loop argument for `source` is dead. The correctness argument is what is left.

Re-measured properly on `orchestrator` **[measured]**:

|            | warm baseline | build    | re-run | **edit → verdict** |
|------------|---------------|----------|--------|--------------------|
| A (dist)   | 67.0s         | **1.9s** | 70.3s  | **72.2s**          |
| B (source) | 73.0s         | none     | 71.2s  | **71.2s**          |

`npm run build --workspace=@dungeonmaster/shared` is incremental `tsc` and costs **1.9 seconds**, not the 3.0s the
earlier small-package run suggested. **Both loops land at about 72s. There is no speed case for B.**

**But the correctness case is demonstrable in two commands.** The agent appended
`throw new Error('PROBE_SOURCE_RESOLUTION');` to `packages/shared/src/contracts/file-path/file-path-contract.ts`, did
**not** build, and ran one orchestrator test file:

| Arm             | Result                                                              |
|-----------------|---------------------------------------------------------------------|
| B (`source`)    | `FAIL — Test suite failed to run / PROBE_SOURCE_RESOLUTION`, exit 1 |
| A (dist, today) | **`PASS 1 files`, exit 0**                                          |

**Today's configuration runs green against source it has never seen.** That is the stale-`dist` hazard, live,
reproducible, and it is the whole argument for H1.

### E4d. Two further findings from that probe

**Ward passes `--runInBand` unconditionally**, not only as a consequence of `--detectOpenHandles`
**[source: `check-run-unit-broker.ts:161`, the no-file-scope `else` branch]**. And there is a **third**
enforcement point the doc missed until review: `jest.config.base.js:28-29` sets `detectOpenHandles: true`
and `forceExit: true` in the shared config, so **every** jest invocation in this repo runs in band, ward's or a bare one
**[source]**. Lifting D1 alone would change nothing.

> **CORRECTED.** This section originally concluded *"This makes `CONCURRENCY_LIMIT` the ONLY parallelism
> lever on unit's 304s."* **That does not follow.** `CONCURRENCY_LIMIT` parallelises *across* packages,
> and B's correction 2 shows the 304.2s is **one package's serial run** — `packages/web`'s. Concurrency
> cannot touch it by construction. The levers on that number live inside `packages/web`, whose unit
> suite is analysed nowhere in this document. E4b measured `shared` (566 files, 53–56s warm) and
> `orchestrator` (516 files, 62–71s warm), both a fraction of it. **That is the largest unexamined item
> here.** E12's 40s gain is real and separately measured as wall clock; it just is not a gain against
> 304s.

**`packages/web`'s `testEnvironmentOptions` also carries `url: 'http://localhost'`** alongside
`customExportConditions: ['']`. Applying H1's one-liner as written to `web` would silently drop both. Web needs a
merge — `['source', '', 'require', 'default']` plus the `url` — never a replacement.

### E5. The e2e probe

Run by a sub-agent in its own worktree, one full Playwright suite plus targeted experiments. **A sibling agent was
measuring on the same machine throughout, so treat every absolute second as an upper bound; the ratios and the request
counts are the trustworthy parts.**

#### E5a. e2e reads `dist`, but narrowly, and only through the test tooling

**The app under test already runs entirely from source.** The API server boots as
`tsx --conditions=source bin/server-entry.ts`, and `packages/web/vite.config.ts` sets
`resolve.conditions: ['source']`. Parking `packages/server/dist` **and** `packages/orchestrator/dist`
entirely and running a smoke spec gave **5 of 5 passing**. `packages/web/dist` is never touched — Vite dev serves
source.

**The test tooling does not.** Playwright's config loader and its spec/harness transform use plain Node CJS `require`
with no `--conditions`, so all 34 spec files, 20 harness files and the config itself resolve `@dungeonmaster/shared/*`
to `dist/*.js`. Vite's own config loader is outside
`resolve.conditions` for the same reason.

| Package                         | e2e needs its `dist`? | Evidence                                                                                                                                                                                                                                  |
|---------------------------------|-----------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `shared`                        | **Yes**               | Parked it; one spec died at `playwright.config.ts:4`, `Cannot find module …/packages/shared/dist/statics.js`, thrown from Playwright's own transform. `npm run dev:no-watch` died the same way on `dist/brokers.js` from `vite.config.ts` |
| `testing`                       | **Yes**               | Three harness files import `@dungeonmaster/testing/*`; `require.resolve` from `packages/web` lands in `packages/testing/dist/src/…`                                                                                                       |
| `server`, `orchestrator`, `web` | **No**                | Parked; 5 of 5 specs passed                                                                                                                                                                                                               |

**The obvious fix does not work, and this was tested rather than assumed.**
`NODE_OPTIONS=--conditions=source npx playwright test` gets past the config, then dies inside
`packages/shared/brokers.ts` with `ERR_MODULE_NOT_FOUND … architecture-overview-broker`. The root barrels use
extensionless relative imports, which need a TypeScript loader — `tsx` has one, plain Node, Playwright's loader and
Vite's config loader do not.

**Also in the blast radius:** `packages/web/jest.config.cjs` hardcodes
`<rootDir>/../../packages/testing/dist/src/startup/start-endpoint-mock-setup.js` in
`setupFilesAfterEnv` — a literal `dist` path inside a jest config.

#### E5b. The 415 seconds are 99% test execution — there is no overhead bucket

One full run at ward's exact invocation:

| Bucket                                      | Time                   | Share     |
|---------------------------------------------|------------------------|-----------|
| API server boot (`tsx --conditions=source`) | 1.86s warm, 4.86s cold | 0.5%      |
| Vite boot plus forced dep pre-bundle        | 0.35s                  | 0.1%      |
| Browser launch and teardown                 | about 1s               | 0.3%      |
| **Test execution**                          | **353.8s**             | **99.1%** |
| Wall total                                  | **357.0s**             |           |

The sum of 412 individual test durations is 345.8s, 97% of wall. **Boot is noise.** The gap between this 357s and the
415.5s in §B is ward's own wrapper plus a cold `tsx` cache plus contention, and it was not split.

#### E5c. The cost is one 400ms page load charged 412 times

Step-level timings over a 55-test subset (42.3s, mean 769ms):

| Step                                  | n   | avg       | total |
|---------------------------------------|-----|-----------|-------|
| `Navigate` (`page.goto`)              | 55  | **395ms** | 21.7s |
| `waitForEvent("response")`            | 48  | **417ms** | 20.0s |
| `waitForSelector`                     | 174 | 23ms      | 4.0s  |
| `Click`                               | 67  | 51ms      | 3.4s  |
| `expect` (auto-retry)                 | 201 | 16ms      | 3.2s  |
| Before Hooks (seeding, `cleanGuilds`) | 55  | **38ms**  | 2.1s  |
| After Hooks                           | 55  | 45ms      | 2.5s  |

`goto` and `waitForResponse` overlap through `Promise.all`, so those two do not add. **The seeding hooks are not the
cost. The page load is.**

**Why one navigation costs 400ms:** the trace for a single `goto` shows **404 HTTP requests, every one a 200, zero cache
hits, 13.4 MB.** 359 are individually unbundled `/src/*.ts(x)` modules from the Vite **dev** server; 34 are
`node_modules/.vite-<port>/deps/*` pre-bundle chunks totalling 10.5 MB of unminified dev React, Mantine, xyflow and
elkjs. Playwright gives every test a fresh browser context, so the HTTP cache starts empty each time. **Across the suite
that is roughly 166,000 requests and 5.5 GB over localhost.**

#### E5d. No spec dominates — it is a flat tax

Per-test distribution across 410 tests: **p50 702ms, p75 1043ms, p90 1230ms, p99 4023ms, max 8360ms**, mean 839ms. 161
tests land in the 500–700ms band. Top 5 files are 29.1% of the total, top 10 are 44.6%, top 20 are 63.5%. Only 7 tests
exceed 3s.

The few API-only tests that never open a page run in 50–100ms. That is the floor, and `goto` is what separates it from
700ms.

**There is no slow spec to fix.**

#### E5e. One worker on twelve cores, and raising it today makes things worse

`playwright.config.ts` sets `workers: 1`, `fullyParallel: false`, `timeout: 10_000`. `nproc` is **12**. CPU across the
full run was `USER 219.7s / SYS 66.7s` over 357s wall — **80% of a single core, eleven idle.**

Measured on the same 6 spec files (78 tests):

|                                | Result                   | Time  |
|--------------------------------|--------------------------|-------|
| `--workers=1`                  | 78 passed                | 66.7s |
| `--workers=4 --fully-parallel` | **21 failed, 57 passed** | 63.9s |

**Zero speedup and a 27% failure rate.** The blocker is shared server state, not CPU:
`guildHarness.beforeEach` is `cleanGuilds()`, which lists and then DELETEs **every** guild on the one shared API server.
**98 of 102 spec files call it.** One API server, one `DUNGEONMASTER_HOME`, one
`config.json` — the harness's own comment notes that concurrent DELETEs corrupt it on read-modify-write. The failures
are `element(s) not found` and `waitFor` timeouts, the signature of another worker deleting your guild mid-test.

Two things are already parallel-safe: the fake-Claude queue is cwd-scoped, and ward gives each run its own port pair,
report name and `outputDir`. `test.describe.serial` appears nowhere.

#### E5f. `customExportConditions: ['']` is MSW's jsdom workaround — G7 answered

`packages/web` is the only package with `testEnvironment: 'jsdom'` and the only one carrying this option.
`jest-environment-jsdom` defaults `customExportConditions` to `['browser']`.
`node_modules/msw/package.json`'s `exports["./node"]` contains **`"browser": null`**, as does
`@mswjs/interceptors`' `exports["./ClientRequest"]`. Under `['browser']`, resolving `msw/node` hits the
`null` branch and Node throws `ERR_PACKAGE_PATH_NOT_EXPORTED`. `['']` drops `browser` from the condition set so the
`node`/`require` branch wins.

The repo does use MSW there — `setupFilesAfterEnv` loads
`packages/testing/dist/src/startup/start-endpoint-mock-setup.js` and `transformIgnorePatterns`
whitelists `msw|@mswjs|until-async|outvariant|undici`. Not proven by a remove-and-break experiment, but the
`"browser": null` entries are unambiguous.

**This matters for H1.** `web`'s conditions are load-bearing for a reason unrelated to `dist`, so adding `source` there
means `['source', '', …]` rather than replacing what is present.

#### E5g. What the e2e probe could not establish

- Whether ward's 415.5s and this 357s differ by ward's wrapper or by machine contention. Not split; it would cost a
  second full run.
- The exact split between `goto` and `waitForResponse`, since they overlap.
- Whether a production `vite preview` bundle actually delivers the saving in H5. The 404-requests figure is measured;
  the saving is arithmetic from it.
- Whether specs pass at 4 workers once `cleanGuilds` is namespaced. `session.harness.ts`'s
  `cleanSessionDirectory` / `cleanSessionFiles` and `claudeMockHarness`'s root-level
  `clearClaudeQueue` are two more global resets that would need the same treatment.

### E6. How a worktree should get its `node_modules` — four strategies, measured

**The requirement, stated by the repo owner.** A worktree that installs a new package keeps it to itself until it
merges. And a version upgrade that lands in the main checkout must **not** reach an existing worktree — that worktree is
on older code and should keep the modules that go with it. It gets the new set only when it merges the main checkout in.

#### E6a. What the tree actually holds

**[measured]**

|                                       | files   | dirs  | size        |
|---------------------------------------|---------|-------|-------------|
| root `node_modules`                   | 48,360  | 3,769 | 360.0 MB    |
| six small per-package trees           | 660     | 72    | 14.4 MB     |
| `packages/web/node_modules` real deps | 3,585   | —     | **19.1 MB** |
| **real payload a worktree needs**     | ~52,600 | —     | **393 MB**  |

**`packages/web/node_modules` also holds 948 MB of garbage: 31 orphaned `.vite-<port>` dependency caches, one per e2e
run that was never cleaned up** **[measured]**. E5 names the mechanism —
`optimizeDeps.force: true` mints a 30 MB cache per run, `e2eArtifactsRemoveBroker` cleans the ones ward knows about, and
`prune-vite-caches.mjs` sweeps the rest on a 2-day delay. 31 have accumulated. Any copy strategy must exclude them, and
they are 948 MB of reclaimable disk regardless.

The filesystem is **ext4**: no reflink, so copy-on-write file copying is not available.
`fuse-overlayfs` is not installed. That leaves symlinks, hardlinks and real copies.

#### E6b. The four strategies

Each built into a fresh worktree, `.vite-*` excluded, `@dungeonmaster/*` re-pointed at the worktree's own packages
**[measured — `tmp/nm-strategies.py`]**:

| Strategy                                                          | Setup     | Incremental disk | Inodes added |
|-------------------------------------------------------------------|-----------|------------------|--------------|
| **symlink-all** — today's `pm-worktree-setup.sh`                  | **0.01s** | ~3 MB            | 785          |
| **symlink, skip dot-entries, real `.bin`** — the owner's proposal | **0.02s** | ~3 MB            | 841          |
| **hardlink** (`cp -al`)                                           | **0.65s** | **20.4 MB**      | 57,639       |
| **full copy** (`cp -a`)                                           | **6.65s** | **532.3 MB**     | 57,639       |

Incremental disk is `du` over the main checkout plus one worktree, minus the main checkout alone — so the hardlink
figure is real, not an artifact of `du` counting shared inodes twice.

#### E6c. Only two strategies meet the requirement

Tested on a synthetic tree so the real `node_modules` was never touched **[measured]**:

|                       | new package stays in the worktree | **main upgrades a package → worktree keeps the old one** | in-place edit in main does not leak |
|-----------------------|-----------------------------------|----------------------------------------------------------|-------------------------------------|
| symlink-all           | yes                               | **NO — leaks immediately**                               | **NO**                              |
| symlink + real `.bin` | yes                               | **NO — leaks immediately**                               | **NO**                              |
| **hardlink**          | **yes**                           | **YES**                                                  | NO — shared inode                   |
| full copy             | yes                               | yes                                                      | yes                                 |

The upgrade test simulates what npm actually does: remove the package directory, re-extract the new version. That breaks
the hardlink and leaves the worktree holding the old inode, which is exactly the requested behaviour. A symlink follows
the replacement and the worktree silently jumps versions.

**Hardlink's one real risk is in-place mutation.** A tool that appends to or edits a file *within*
`node_modules` rather than replacing it changes both trees, because they share the inode — confirmed on a pristine tree.
npm does not work that way; a patch script or a build cache written inside
`node_modules` would.

#### E6d. Three of four strategies fix the `.bin` problem for free

C6a found that a worktree runs the main checkout's `dungeonmaster-ward`. The cause is narrower than it looked. npm's
shims are **relative** — `dungeonmaster-ward` is
`../@dungeonmaster/ward/dist/bin/ward-entry.js`. Where that lands depends only on whether `.bin` is a real directory:

| Strategy              | `.bin`                       | `dungeonmaster-ward` resolves to |
|-----------------------|------------------------------|----------------------------------|
| symlink-all (today)   | one symlink to main's `.bin` | **MAIN CHECKOUT**                |
| symlink + real `.bin` | real dir                     | **worktree**                     |
| hardlink              | real dir                     | **worktree**                     |
| full copy             | real dir                     | **worktree**                     |

Confirmed on the live worktrees too: `probe-e2e` and `pm-flows-slow` both resolve to the main checkout. **So the
owner's "symlink but not `.bin`" instinct is right, and it is a two-line change to
`pm-worktree-setup.sh`** — stop linking `.bin` as a directory, create it, and relink its entries.

#### E6e. Decided: hardlink (D3)

**Hardlink meets both stated requirements at 0.65s and 20 MB**, and fixes the `.bin` borrow as a side effect. It is 65×
slower than symlinking in relative terms and irrelevant in absolute terms — against the 55s build a worktree needs
today, it is noise. Against a worktree that needs no build (H2), it is still under a second.

Inode cost is not a constraint: 23.1 million free on this disk, so about **400 hardlinked worktrees** of headroom
**[measured]**.

Two carried risks, neither blocking:

- Whether anything in this repo writes **in place** inside `node_modules`. The `.vite-<port>` caches are created fresh
  rather than mutated, so they are fine, but nobody has swept for others (G15).
- `cp -al` cannot cross filesystems. Everything here is one ext4 volume, so it is fine today, and it would break for a
  worktree placed on another mount.

**Two implementations must change together**, and they are the two the traps in C3 already name:
`tmp/pm-worktree-setup.sh` and `worktreePopulateNodeModulesBroker` in the orchestrator. Both must keep excluding
`.vite-*` and keep re-pointing `@dungeonmaster/*` at the worktree's own packages; neither should link `.bin` as a
directory any more.

### E7. A correctly-configured source typecheck: zero `dist`, zero errors — G5 and G9 answered

E1's whole-repo program reported 2,367 errors, all of them artifacts of a hand-rolled config. This is the same idea
configured properly, as **two programs** — the split E2 showed is unavoidable, since
`web` needs `jsx` and the DOM lib that backend packages must not get.

**Three things made the difference, and all three are mechanical** **[measured: `tmp/tsc-backend-probe.cjs`,
`tmp/tsconfig.backend.json`]**:

1. **A `paths` map generated from each `package.json`'s `exports.source` field** — 31 entries derived with no
   hand-editing, plus 2 written by hand for `eslint-plugin`, which has no `source` condition (A9's gap).
   `tmp/dm-paths.json` holds the generated map.
2. **`packages/*/@types/**/*` added to `include`**, which is what `packages/mcp/@types/modelcontextprotocol.d.ts`
   needs. Without it, the SDK import is the single remaining error.
3. **`packages/web/**/*` excluded**, running as its own program (A7).

Result for the 13-package backend program:

|                                                |           |
|------------------------------------------------|-----------|
| root files globbed                             | 6,318     |
| program files                                  | 7,268     |
| `shared` **source** `.ts` in program           | **1,507** |
| **ANY `packages/*/dist/**/*.d.ts` in program** | **1**     |
| **ERRORS**                                     | **0**     |

`@dungeonmaster/testing` now resolves to 310 source files rather than `dist`, so **the `paths` map closes A9's gap in
one config entry** — G9 answered yes.

Incremental cost, driven by the semantic-diagnostics builder with the buildinfo in `tmp/`
**[measured: `tmp/tsc-backend-incremental.cjs`]**:

| Scenario                                      | Files re-checked | Total     | Errors |
|-----------------------------------------------|------------------|-----------|--------|
| Cold                                          | 7,215            | **17.1s** | 0      |
| Warm, nothing changed                         | 0                | **3.7s**  | 0      |
| One leaf guard edited                         | 16               | **4.3s**  | 0      |
| `file-path-contract.ts` edited (~1,300 users) | 3,372            | **17.0s** | 0      |

Add `web`'s own program at 9.8s cold (A7) and the whole repo typechecks from source, emitting nothing.

> **CORRECTED — this section originally compared these numbers against "today's `tsc -b` at 9.2s
> warm". That comparison is invalid, and the reviewer who caught it is right.**
>
> The 9.2s is **not** `tsc -b`. It is `packages/web`'s per-package `tsc --noEmit`. Web is the one
> package excluded from the references path (A7), so it is the only child that reports a typecheck
> duration, and `Math.max` over a one-element bucket returns it. A7's own probe measured web at
> 1.8s + 8.0s = 9.8s against the recorded 9.181s, which confirms it.
>
> **`tsc -b`'s duration is recorded in no artifact in this repo.** It completes before `runStartMs`,
> and its synthesised `ProjectResult`s carry no `durationMs`. So three claims in this doc — E1's
> "5.3s against 9.2s", E7's original line, and H5's table row — all compared a **backend-only source
> program** against a **web-only dist program**. And the proposed total is 3.7s (backend) + 9.8s (web)
> = 13.5s, against a "today" figure that already excludes the build.
>
> **H2's speed claim is unsupported. Its correctness claim — zero errors, zero `dist` — is untouched,
> and is what should carry it.**

For the record, unconflated: the backend source program is **3.7s warm and 4.3s on a typical edit**, and its worst case
(editing a contract 1,300 files depend on) is 17.0s. What it costs relative to
`tsc -b` is unknown.

**G5 is answered: the real error count is zero.** That, and the fact that it emits nothing, is the case for H2.

### E8. Lint under source resolution costs nothing — G17 answered

This was the biggest unmeasured risk to H2. Lint is 67.3s of the run, and H2 changes the shape of every package's type
program, so a regression here would have been expensive.

**Program level first.** Built `packages/orchestrator`'s typed-lint program both ways through the watch host typed lint
actually uses, interleaved **[measured: `tmp/lint-cost-probe.cjs`]**:

| Arm                  | program files | source `.ts` | `dist/*.d.ts` | construct  | check      | total      | errors |
|----------------------|---------------|--------------|---------------|------------|------------|------------|--------|
| A — `dist`, today    | 2,633         | 1,431        | **741**       | 2.2s, 2.0s | 4.4s, 4.4s | 6.6s, 6.4s | 0      |
| B — `paths` → source | 3,201         | 2,402        | **0**         | 2.1s, 1.9s | 5.9s, 6.8s | 8.0s, 8.7s | 0      |

**Construction is identical.** The difference sits entirely in the check phase, because the source program holds 568
more files — source `.ts` is bigger than the `.d.ts` it compiles to.

**That difference does not reach eslint, and the end-to-end run proves it.** ESLint never calls
`getSemanticDiagnostics`; typescript-eslint pulls type information lazily, only for what its rules ask. Full
`ward --only lint` on `packages/orchestrator`, 1,443 files, interleaved in a worktree **[measured]**:

| Arm                  | run 1 | run 2 | mean      |
|----------------------|-------|-------|-----------|
| A — `dist`, today    | 58.8s | 54.1s | **56.5s** |
| B — `paths` → source | 51.8s | 53.5s | **52.7s** |

**Ratio B:A = 0.93.** Both arms PASS all 1,443 files. Within the noise of a contended box, source resolution is free for
lint, and possibly slightly cheaper.

### E9. `eslint.config.js` costs 3.6s per process, and it is nearly all plugin compilation — G18 answered

B6's anecdote was right. Timed directly **[measured]**:

|                                           |                         |
|-------------------------------------------|-------------------------|
| `node -e "require('./eslint.config.js')"` | **3.80s, 3.58s, 3.59s** |

Broken down:

| Step                                               | Cost      |
|----------------------------------------------------|-----------|
| `require('ts-node/register')`                      | 0.14s     |
| `require('./packages/eslint-plugin/src/index.ts')` | **2.56s** |
| `require('./packages/local-eslint/src/index.ts')`  | **0.68s** |
| the config broker and calling it                   | 0.00s     |

**3.24 of the 3.6 seconds is ts-node compiling the two plugin packages from TypeScript source.**
`ts-node/register` itself is nearly free.

Two places that bill lands:

1. **Ward spawns one eslint per package.** 14 × 3.6s is about **50 CPU-seconds** per full run, before a single file is
   linted. At `CONCURRENCY_LIMIT = 4` that is roughly 12.6s of the 67.3s lint wall — about 19%.
2. **Every single-file lint pays the whole 3.6s.** The `dungeonmaster-post-edit-lint` hook runs on edits, so this is a
   per-edit tax on every agent in every session, and it dwarfs the cost of actually linting one file.

**The tension with H2, stated plainly.** Fixing this means building the plugins and having
`eslint.config.js` require `dist` instead of source — which reintroduces a `dist` dependency for lint, exactly the thing
H0 removes. It is a *different* `dist` (plugin code, which changes rarely)
than the one H2 is about (package types, which change constantly), so the two can be decided separately. But they cannot
both be maximised.

### E10. A built bundle cuts the e2e suite by a third — G10 answered, with a catch

Run by a sub-agent in the `probe-e2e` worktree, interleaved A/B/A/B, other jobs on the box throughout **[measured]**.
Variant A is today's Vite **dev** server in `playwright.config.ts`'s `webServer`. Variant B swaps it for `vite preview`
against a production build, everything else identical.

**All 412 results are green in both arms** — 410 expected, 0 unexpected, 0 flaky, the same 2 skips. No selector, URL,
`/src/*` path or `import.meta.env` assumption broke. The suite drives the app through test-ids and API traffic, not
through dev-server artifacts.

| Variant     | Run | Wall       | mean/test | p50   | p90    | max    |
|-------------|-----|------------|-----------|-------|--------|--------|
| A — dev     | 1   | 373.6s     | 880.8ms   | 749ms | 1325ms | 8316ms |
| A — dev     | 2   | 357.0s     | 844.4ms   | 715ms | 1254ms | 8359ms |
| B — preview | 1   | **240.1s** | 561.5ms   | 451ms | 837ms  | 7913ms |
| B — preview | 2   | **241.7s** | 565.0ms   | 451ms | 839ms  | 7853ms |

**Wall ratio B:A = 0.66.** Within-arm spread was 4.5% for A and 0.7% for B, so the ratio sits well outside the noise.

> **CORRECTED.** This originally read *"365.3s down to 240.9s, a saving of 124.4s"* and H5 banked that
> absolute. **The ratio is trustworthy; the absolute is not** — it was measured against a contended
> baseline, which this doc says elsewhere and then forgot here. Ward's **median** e2e is 248s, so the
> expected saving is about **85s**, netting about **75s** after the 10.4s build. Still the largest
> single lever; about 40% smaller than the headline.
>
> The record also settles E5g's first open question for free: ward's median e2e (248s) is *below* the
> standalone probe's 357s, so **ward's wrapper costs nothing** and both large figures were contention.
> That never needed a second full run.

Per navigation, measured through CDP on a fresh context:

|               | A (dev)  | B (preview) |
|---------------|----------|-------------|
| **Requests**  | **404**  | **8**       |
| On-wire bytes | 13.38 MB | 0.74 MB     |
| `goto` → load | 587ms    | 190ms       |

**50× fewer requests.** The byte ratio mixes bundling with compression, since `vite preview` gzips and the dev server
does not, so request count is the clean comparison. Variant A reproduces the earlier probe exactly, which
cross-validates both measurements.

`npm run build --workspace=@dungeonmaster/web` costs **10.4s**, one-off and amortised across repeat runs. **So 10.4s
buys 124s: net about −114s per suite run.**

**Correcting my own arithmetic.** H5 projected ~155s from a 400ms per-test saving. The real per-test saving is **299ms
mean, 281ms p50**, so the real number is **124s**. The cross-check is clean:
299ms × 412 = 123.4s against a measured wall delta of 124.4s — **the entire saving is per-test, exactly as predicted,
just smaller than assumed.** The tail is untouched (max 8.3s → 7.9s): the slowest tests are not page-load bound.

**A built bundle does NOT unlock parallelism.** Under variant B, six spec files at `--workers=4
--fully-parallel` still gave **19 failed and 2 timed out of 99**, with wall barely moving (72.3s → 69.5s). Same
`element(s) not found` shape. **This settles E5e's open question the other way from what you might hope: faster page
loads do not help, because the blocker is `cleanGuilds()` deleting every guild on the one shared API server, not load
latency.**

#### E10a. The catch — this lever reintroduces the exact hazard H0 removes

`vite preview` serves a **frozen bundle**. There is no watcher and no error. **A suite run after an un-rebuilt source
edit tests the previous code and reports green.**

That is the same shape as the stale-`dist` failure E4c demonstrates, on a different artifact. The probe measured the
build cost but not the failure mode of forgetting it, and **nothing in the config would catch it**.

So the largest single speed lever in this document and the central correctness fix pull in opposite directions. Any
proposal that takes E10 has to say how the bundle stays fresh — rebuild before every e2e run at 10.4s, or gate on a
source fingerprint, or something else. **Unresolved. [open]**

Two smaller unknowns the probe names: debuggability under a minified bundle is untested, because nothing failed under B
so no source-mapped stack was ever seen; and the full 102-file suite was never run at `--workers=4`.

### E11. Concurrent ward runs did not corrupt anything — G19 answered, and it overturns the doctrine

Run on a quiet box, load average 1.04, no other jobs. One worktree, so every run shared one `dist` — that sharing is the
hazard under test. Each concurrent run scoped to a **different** package, which is the C1 sub-agent shape
**[measured]**.

**First, a finding that arrived on the way.** A run scoped to `-- packages/tooling` still reports
`typecheck: PASS 13 packages (6313 files)`. **Every ward run with typecheck in scope performs a full-repo `tsc -b`,
however narrow its file scope.** `command-run-broker` computes `preComputedTypecheck`
over all eligible folders regardless of passthrough. So a "scoped" run is a whole-repo build.

| Arm                        | Setup                                                                                                     | Runs | Result                      |
|----------------------------|-----------------------------------------------------------------------------------------------------------|------|-----------------------------|
| Baseline                   | one ward alone, `--only lint,typecheck,unit -- packages/tooling`                                          | 1    | PASS, 17.3s wall            |
| N=2                        | two wards, different packages                                                                             | 2    | **both PASS**, 20.8s wall   |
| N=4, forced emit           | shared source edited first so all four must rebuild                                                       | 4    | **all PASS**, 36.8s wall    |
| N=4, forced emit, repeated | the same, five more times                                                                                 | 20   | **5 of 5 iterations clean** |
| **1 writer + 3 readers**   | one `--only typecheck` (writes `dist`) against three `--only lint,unit` (read it) — the exact C1/C2 shape | 16   | **4 of 4 iterations clean** |
| Semantic race              | a reader mid-run while a sibling breaks shared source and builds it                                       | 8    | **2 of 2 clean**            |

**About 30 concurrent ward runs across four shapes, hunting specifically for phantom `TS2339`,
`ENOENT`, `Cannot find module` and any FAIL the solo baseline was green on. Zero corruption of any kind.**

#### E11a. The one corruption ever observed was a SOURCE race, not a `dist` race

Every mention of corruption across the reports and both CLAUDE.md files is **the rule restating its own rationale** — *"
the corruption risk the rule exists to prevent"*, *"the corruption window the `[BUILD]`
rule exists to close"*, *"removes a concurrent-`dist/` corruption hazard"*. None of them records a corrupted result.

The post-mortem says the window *"fired at least once, observed, in item [3]"*. What report 03 actually observed is a
**collision** — a build starting while another agent was mid-edit — not a wrong answer.

**The single instance where a false error was actually seen is report 06 §5.1, and it is a different hazard entirely**
**[source]**:

> `12.7m`: *"It flagged a transient type error in the harness file another agent was mid-write on — a
> race artifact I'll confirm once that agent returns"*
> `12.8m`: *"That also settles the type error the adapter agent saw — it was reading the file mid-write."*

**An agent read a SOURCE file while another agent was writing it.** That is not two builds colliding over `dist`. It
would have happened with no build running at all, and **the build ban does not prevent it.** What prevents it is giving
each agent its own tree — C3 and D3.

#### E11b. What this does and does not establish

**Establishes:** at N up to 4, on small-to-medium packages, on one machine, across ~30 runs and four deliberately
adversarial shapes, concurrent ward runs produced no corrupted result.

**Does not establish:** behaviour at the N of 20–40 the post-mortems describe; behaviour on `web`,
`orchestrator` or `server`, where builds run longer and the write window is wider; two full
`npm run build --workspaces` runs against each other, which is a different writer using
`tsconfig.build.json` for two packages; or anything about a machine under memory pressure.

**The honest reframing.** The measured problem is not corruption. It is **staleness** — E4c's demonstration that today's
configuration reports `PASS` against source it has never seen. That is reproducible in two commands, it is silent, and
it is what the build ban was reaching for by proxy. Concurrency contention is real (17.3s solo → 36.8s at N=4) but it is
a cost, not a correctness failure.

### E12. `CONCURRENCY_LIMIT` is worth about 30%, not the 4× a confounded run suggested — G4 answered

Full `--only unit` across all 14 packages, quiet box, 12 cores, 62 GB RAM. `CONCURRENCY_LIMIT` made env-driven in a
worktree and ward rebuilt there **[measured]**.

**The first sweep was confounded and is recorded so nobody repeats it.** Its concurrency=4 run took 531s against 139s at
8, which looks like a 3.8× win. It is not. **The first run of the sweep paid a cold jest transform cache**, because
jest's cache keys include file paths and a worktree's paths differ from the main checkout's. Runs 2 and 3 ran warm.

Re-measured with the cache warm throughout:

| `CONCURRENCY_LIMIT` | wall     | peak node RSS |
|---------------------|----------|---------------|
| **4 — today**       | **180s** | 6.9 GB        |
| 8                   | **140s** | 9.7 GB        |
| 12                  | **125s** | 11.2 GB       |

**4 → 8 saves 40s (0.78×). 4 → 12 saves 55s (0.69×), for 62% more memory.** All arms PASS 2,674 test files. The curve
flattens hard after 8, which is what you expect when jest is serial inside each package and the pool is only hiding
per-package startup.

Memory is the real cap, and it is machine-specific: 11.2 GB peak at 12 is comfortable on a 62 GB box and would not be on
16 GB. **Any change here should read the limit from config or from core count rather than replacing one hardcoded number
with another.**

#### E12a. A worktree starts with a COLD jest cache, and that is the real per-worktree cost

The confound above is a finding. **531s cold against 180s warm on the same work: the jest transform cache is worth about
350 seconds on a full unit run**, and a fresh worktree does not inherit it, because jest keys on absolute file paths.

That reprices C3 and D3. The `node_modules` setup is 0.65s (E6) and the build is about a minute (C3), but **the first
full unit run in a new worktree pays roughly 350s more than a warm one.** Nobody has counted that. It does not change
D3 — the alternatives share the same problem — but any proposal that mints worktrees per sub-agent needs it in the
arithmetic, and a shared `cacheDirectory` keyed on content rather than path would be the obvious counter. **[open]**

---

## F. Anecdotal claims carried forward

**F1. "Jest compiles shared and orchestrator source rather than dist."** Reported as 1,246 of 1,451 modules in one
server test file **[anecdotal]**. The resolver disagrees — cross-package specifiers go to `dist/*.js`, which the
`^.+\.ts$` transform never touches **[measured, A3]**. The cache-surgery numbers are credible; the attribution to
cross-package source is not established. The package's own
`src/**/*.ts` would produce the same cost. **This claim would become true under E3.**

**F2. "The 20 seconds is a seat, not a file."** The in-band half is confirmed **[measured, B3]**. The seat-inheritance
half — jest's sequencer keeping the slowest-recorded file first — is not reproduced here.

**F3. "`isolatedModules` is closed off."** The AST proxy-mock transformer needs a `ts.Program` and
`transpileModule` supplies none **[anecdotal]**. Consistent with
`packages/testing/ts-jest/proxy-mock-transformer.js:53` taking `{ program }` **[source]**. Not tested.

**F4. "`get-project-map` scans the whole repo once per package, about 5s."** **[anecdotal]**, untouched.

---

## G. Questions

### Still open — these are what a proposal has to decide or accept

| #       | Question                                                                     | Why it matters                                                                                                                                                                                                                                                         |
|---------|------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| ~~G20~~ | How does a built bundle stay fresh, without one run disturbing another?      | **ANSWERED — hash the build inputs (0.10s) and store each bundle in its own package's `.ward/bundle/<hash>/`.** Rebuild only when the hash changes; nothing ever writes an existing hash directory, so a run in progress cannot be touched. See Pivot 3                |
| G11     | Is `cleanGuilds` the only thing blocking parallel e2e workers?               | E10 rules out page-load latency. Two more global resets are named in E5g                                                                                                                                                                                               |
| G12     | Can the e2e test tooling reach source without a TypeScript loader?           | The one place `dist` survives a source-based repo. Extensionless barrel imports are the obstacle (E5a)                                                                                                                                                                 |
| G22     | How does ward give free ports to a suite that needs more than two processes? | It hands out exactly two, `DUNGEONMASTER_PORT` and `DUNGEONMASTER_WEB_PORT`, from `netFreePortPairAdapter`. A consumer with a third server has no way to ask. Exists today; see Pivot 3                                                                                |
| G8      | Can the eslint plugin load without `ts-node` per process?                    | 3.6s per eslint process, and a tax on every post-edit hook (E9). **The obvious fix reintroduces a `dist` dependency for lint**                                                                                                                                         |
| ~~G21~~ | Can jest share one content-keyed cache across worktrees?                     | **WITHDRAWN — no, it would bleed.** ts-jest's emit depends on sibling types, so a content-only key collides across trees and one would run the other's compiled output. The path in the key is correct behaviour, and the ~350s is the price of isolation. See Pivot 2 |
| G14     | What does a canary tier look like when the instrument is what changed?       | A broken harness reddens everything, so the broad run says nothing (C6c)                                                                                                                                                                                               |
| ~~G6~~  | Where does a tsc buildinfo live when several runs share a tree?              | **ANSWERED — in `.ward/`, and sharing one degrades to a cold re-check rather than corrupting.** No lock needed. See Pivot 2                                                                                                                                            |
| G15     | Does anything in this repo write **in place** inside `node_modules`?         | Hardlinking's only failure mode. D3 carries it (E6c)                                                                                                                                                                                                                   |
| G13     | Should a worktree's `.bin` point at its own packages always, or on request?  | Mechanically solved by D3 (E6d); the *policy* is a choice, since borrowing is right for C4 and wrong for C6                                                                                                                                                            |
| —       | Does concurrency behave differently **after** H2?                            | The one arm E11 did not run. See §I                                                                                                                                                                                                                                    |

### Answered

| #   | Question                                                   | Answer                                                                 |
|-----|------------------------------------------------------------|------------------------------------------------------------------------|
| G1  | Does typed lint read `dist` outside `web`?                 | **Yes** — 689 `.d.ts` for orchestrator, 0 source. A8                   |
| G2  | What does the source switch cost jest on the big packages? | **1.00× and 1.13× cold**, all tests pass. E4b                          |
| G3  | Does e2e read `dist`, and where do its 415.5s go?          | **Narrowly yes** (tooling only); 99% of the time is test execution. E5 |
| G4  | Is `CONCURRENCY_LIMIT = 4` right?                          | **8 saves 40s, 12 saves 55s**; memory is the cap. E12                  |
| G5  | What does a correctly-configured source program report?    | **Zero errors, zero `dist`.** E7                                       |
| G7  | Why does `web` set `customExportConditions: ['']`?         | **MSW's jsdom workaround.** E5f                                        |
| G9  | Does a `paths` mapping close A9's gap?                     | **Yes**, generated from `exports.source`. E7                           |
| G10 | Would a built e2e bundle deliver the projected saving?     | **−124s, not −155s**, all tests green. E10                             |
| G17 | What does typed lint cost reading source?                  | **0.93× — free.** E8                                                   |
| G18 | What does `ts-node` in `eslint.config.js` cost?            | **3.6s/process**, 3.24s of it plugin compilation. E9                   |
| G19 | Do concurrent ward runs corrupt each other?                | **No** — ~30 runs, four shapes, zero corruption. E11                   |
| G16 | The 31 orphaned `.vite-<port>` caches, 948 MB              | Not a task here; cleanup lives elsewhere in the repo                   |

---

## H. An early shape, kept for the record

**Read §E before §H, not after.** This section was drafted partway through the measurement, before E10, E11 and E12
existed. It is retained because its reasoning is still traceable, and because the evidence that later corrected it is
easier to follow with the original in view. **Where §H and §E disagree, §E wins.** Its numbers have been refreshed where
they were simply superseded; its framing has not been rewritten.

Three things it gets wrong or understates, all corrected in §E:

| §H says                                            | §E measured                                                                            |
|----------------------------------------------------|----------------------------------------------------------------------------------------|
| the problem is corruption under concurrency        | no corruption in ~30 concurrent runs (E11). The problem is stale green (E4c)           |
| the source switch costs jest about 2× cold         | 1.00× and 1.13× on the two biggest packages (E4b)                                      |
| this is "a correctness change, not a speed change" | a built e2e bundle is −124s and concurrency is −40s, both independent of it (E10, E12) |

### H0. The principle

**`dist/` becomes a publishing artifact, not a verification input.** Ward neither reads it nor writes it.
`npm run build` stays, as an explicit thing you run when you want to *run* the product — the CLI, the MCP server, the
dev server, a publish — never to *verify* it.

**One residual hole, and E5a found it.** The e2e *test tooling* — Playwright's config loader, its spec and harness
transform, and Vite's config loader — resolves through plain Node CJS with no
`--conditions`, so it still needs `shared/dist` and `testing/dist`. The app under test does not; it already runs
entirely from source. Setting `NODE_OPTIONS=--conditions=source` was tried and fails, because the root barrels use
extensionless relative imports that need a TypeScript loader (G12). So H0 reaches four of five checks cleanly, and e2e
keeps a narrow `dist` dependency until that is solved separately.

### H1. Jest resolves source

Add to `jest.config.base.js`:

```js
testEnvironmentOptions: { customExportConditions: ['source', 'require', 'default'] },
```

Verified working. **E4b supersedes the cost figure here: cold is 1.00× on `shared` and 1.13× on
`orchestrator`, warm unchanged, and all 566 and 516 tests pass in every arm.** Every package inherits the setting.

**`web` needs care, and E5f says exactly what kind.** Its `customExportConditions: ['']` is MSW's jsdom workaround and
is load-bearing for a reason unrelated to `dist`. So `web` becomes
`['source', '', …]` — an addition, never a replacement. Its `setupFilesAfterEnv` also hardcodes a literal
`packages/testing/dist/…` path, which H1 does not fix on its own.

**Unlocks:** unit and integration stop depending on a build. `--only lint,test` becomes a satisfiable brief. The class
of work report 13 could not finish becomes finishable.

### H2. Typecheck resolves source and emits nothing

Two programs, both `--noEmit`, both incremental with the buildinfo under an uncommitted directory:

| Program | Covers                  | Options                                            |
|---------|-------------------------|----------------------------------------------------|
| backend | the 13 non-web packages | base options, union of every package's `typeRoots` |
| web     | `packages/web`          | its existing `jsx` / DOM / ESNext config           |

`web` already runs exactly this way and is green (A7). **E7 supersedes the numbers here: configured correctly, the
backend program reports ZERO errors and ZERO `dist` files, at 3.7s warm and 4.3s on a typical edit against today's
9.2s.**

Package tsconfigs lose `composite`, `references`, `declaration` and `tsBuildInfoFile`. Those move to a
`tsconfig.build.json` per package, used by `npm run build` alone — which also fixes A6, since the build config is the
one that excludes tests.

**Dropping the references is necessary but not sufficient (A9).** `testing` has no root `.ts` barrel and `eslint-plugin`
has no `source` condition, so both would still resolve to `dist` under node10. The cheapest fix looks like one `paths`
entry mapping `@dungeonmaster/*` to `packages/*` in the base tsconfig, which node10 honours and which covers every
package at once. Unverified — G9.

**Unlocks:** typecheck becomes a pure reader. Two sessions running it at once stop being a hazard, so the build ban
stops being needed, so it stops being disobeyed.

**Open:** G5, G6, G9.

### H3. Lint follows, and loses its ts-node bill

Lint reads the same tsconfigs, so H2 carries it — and A8 now proves lint genuinely needs carrying, since today it reads
689 `dist/*.d.ts` files per package.

Separately, `eslint.config.js` compiling two plugin packages through `ts-node` on every process is worth attacking (B6,
G8). A compiled-plugin cache under an uncommitted directory would fit the owner's constraint.

An eslint `--cache` is worth 2.3× warm (B5), and it is hard to make sound in either world, for one reason: **type-aware
lint has cross-file dependencies that ESLint's per-file cache key cannot express.** Change a type in `shared` and a rule
can newly fire in a file that did not change.

The two worlds differ only in how the problem shows up:

|          | Lint's type input | Cache key would have to cover                | Hit rate                                                                                  |
|----------|-------------------|----------------------------------------------|-------------------------------------------------------------------------------------------|
| Today    | `dist/*.d.ts`     | `dist` state, which changes only on a build  | High — but it is caching verdicts computed from a possibly stale input in the first place |
| After H2 | source            | the source tree, which changes on every edit | Near zero                                                                                 |

So a high hit rate today is bought by keying on something that is already the wrong input. Park the eslint cache until
H2 is decided, and treat B5's 2.3× as an upper bound on a sound design rather than a number to bank.

### H4. What each perspective gets

| Perspective                                 | Today                                                                                                         | After H1 + H2                                                                                                                                           |
|---------------------------------------------|---------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| **C1** — sub-agents, one branch             | shared `dist` writer; the broad `--changed` run must build first                                              | no writer. Concurrent scoped wards are safe on one tree, and the broad run needs no build                                                               |
| **C2** — orchestrator, 3 layers             | layer 3 pummels `dist`; 158 measured violations                                                               | layer 3 can run ward freely; the ban is unnecessary                                                                                                     |
| **C3** — worktree per sub-agent             | about a minute, nearly all of it the build                                                                    | ~~**~0.4s.** A worktree needs no build~~ **WRONG — see below**                                                                                          |
| **C4** — dogfooding ward on ward            | circular                                                                                                      | reduces to "which ward binary am I running", a path question rather than a corruption question                                                          |
| **C5** — a stranger's repo                  | ward writes `composite` + `references` into their tsconfigs, creates a root one, and hands them the hammering | ward writes nothing. `projectReferencesSyncBroker` is deleted rather than made safer                                                                    |
| **C6** — a worktree changing the instrument | half-live, half-stale, and it runs the main checkout's binaries anyway                                        | H1 fixes the `@dungeonmaster/testing` half and **D3 fixes the `.bin` borrow**. Still open: the three hardcoded `dist` paths, and the canary tier in C6c |

> **CORRECTED — the C3 row above was wrong three ways, and "a worktree needs no build" is false
> exactly where C6 needs it to be true.**
>
> 1. **0.4s was the symlink strategy D3 replaced.** D3 is 0.32s + 0.65s ≈ 1s.
> 2. **E12a prices a fresh worktree's cold jest cache at about 350s** on a full unit sweep, and says
>    in its own words that any proposal minting worktrees per sub-agent needs it in the arithmetic.
>    This row did not.
> 3. **D3 makes a worktree unable to run `npm run ward` until it builds.** With a real `.bin`, the
>    relative shim resolves to `<worktree>/packages/ward/dist/bin/ward-entry.js`, and `dist` is the
>    first line of `.gitignore`. So a fresh worktree must bootstrap `shared` + `ward` before ward
>    exists at all — and possibly `hooks`, `tooling` and `cli` depending on what the session touches.
>    **That cost is unmeasured** and it is the direct consequence of the fix C6a asked for.
>
> C3 also says "all four pre-existing worktrees"; there are seven.

**What C3 is still for.** Not ward isolation — E11 shows that is not needed. **File isolation**:
stopping two agents editing the same source file, which is the one race ever actually observed (E11a). That problem is
real and nothing else in this document addresses it.

### H5. What this does NOT fix

**This is a correctness and concurrency change, not a speed change.** The 20 minutes barely moves:

| Check       | Today             | After                              |
|-------------|-------------------|------------------------------------|
| typecheck   | 9.2s plus a build | ~5s warm, no build                 |
| unit        | 304s serial       | 304s serial, higher cold transform |
| integration | 70.8s             | same, higher cold transform        |
| lint        | 67.3s             | same                               |
| e2e         | 415.5s            | same                               |

The 20 minutes lives in **e2e (415.5s) and unit (304.2s)**, and neither is touched. With
`--detectOpenHandles` fixed, the remaining levers are these, now that E5 has priced the first two.

**1. Serve e2e a BUILT bundle instead of the Vite dev server. Measured, not projected: −124s.**
Wall goes 365.3s → 240.9s, ratio 0.66, all 412 results green, for a one-off 10.4s `vite build`
(E10). Per navigation, 404 requests become 8. **The catch is E10a: `vite preview` serves a frozen bundle, so an
un-rebuilt edit tests old code and reports green.** Freshness has to be solved with it (G20).

**2. Namespace `cleanGuilds`, THEN raise Playwright's workers.** `workers: 1` on a 12-core box, using 80% of one core
(E5e). Raising it is proven worse in **both** worlds — 21 broken tests on the dev server (E5e) and 21 again under a
built bundle (E10) — because the blocker is `guildHarness.beforeEach`
deleting every guild on the one shared API server, which 98 of 102 spec files call. **Lever 1 does not help lever 2 and
lever 2 does not help lever 1; they are independent.** Two further global resets are named in E5g (G11).

**3. `CONCURRENCY_LIMIT` — measured at 40s from 4→8, 55s from 4→12** (E12), bought with 41% and 62% more memory. The one
ward-level lever the openHandles constraint leaves for unit.

**4. The eslint ts-node startup — 3.6s per process, 3.24s of it plugin compilation** (E9). ~50 CPU seconds per full run,
and a tax on every single-file lint the post-edit hook performs.

**Note what levers 1 and 2 are not.** Neither touches `dist`, neither is blocked by H1 or H2, and neither needs the
concurrency work to land first. **The speed problem and the correctness problem are separable, and they should probably
be separate pieces of work.**

### H6. Shared state that remains after H1 + H2

| Thing                  | Concurrent-safe?                                                            |
|------------------------|-----------------------------------------------------------------------------|
| jest transform cache   | Yes — content-keyed                                                         |
| tsc buildinfo          | **No** — needs a per-run or per-session path (G6)                           |
| eslint cache, if added | **No** — needs a key and a path decision                                    |
| `.ward/run-*.json`     | Yes — per package, per run id                                               |
| `node_modules`         | **No** — still the lock that freezes the main checkout while worktrees live |

---

## I. Method notes, and the two confounds that nearly produced wrong answers

Both parallelism measurements (E11, E12) were run on a **quiet box, load average 1.04, nothing else running.** Every
other figure in this doc came off a contended machine and survives because it was gathered as an interleaved A/B ratio,
where contention hits both arms equally. **The parallelism measurements cannot use that trick, because contention is the
thing being measured.** Anyone re-running them must clear the machine first; a dirty run produces a number that looks
authoritative and means nothing.

**Two confounds were caught, and both would have shipped a wrong headline.**

1. **E11's first arm proved nothing.** Two concurrent wards on an already-warm `tsc -b` both pass trivially, because an
   up-to-date build emits nothing and there is no write to collide with. The arms that count force a shared rebuild
   first.
2. **E12's first sweep looked like a 3.8× win and was not.** The first run of the sweep paid a cold jest cache, because
   a worktree's file paths differ from the main checkout's. Re-measured warm, the real gain is 40s, not 390s. **That
   confound became E12a's finding** — a fresh worktree costs about 350s of cold cache.

### The one arm still owed

E11 measured concurrency **as the repo is today**. It did not measure it **after H2**, because the source-based config
has not been applied to a whole worktree. That arm would answer whether removing the writer changes anything measurable,
and the honest prediction from E11 is that it changes nothing about correctness — because nothing was broken — and
something about contention, because `tsc -b`
work disappears from every concurrent run. **[open]**

---

## J. The direction

**Ward becomes a pure reader.** It reads TypeScript source, it writes nothing outside its own uncommitted results
directory, and any derived artifact it depends on is regenerated by the same command that reads it. Nothing a session
does to verify its work can change what another session sees.

That is one sentence, and it is five pivots.

|       | Pivot                                          | From → to                                                                                                                                              |
|-------|------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| **1** | Resolution moves to source                     | Four checks reading `packages/*/dist` → a `paths` map and a `source` export condition pointing at `packages/*/src`                                     |
| **2** | Ward stops writing                             | `tsc -b` emitting into every `outDir`, plus a broker that rewrites consumers' tsconfigs → `--noEmit` programs, and that broker deleted                 |
| **3** | Derived inputs are hashed, not guessed         | e2e serving unbundled source, 404 requests per page load → a bundle rebuilt only when its inputs change, stored per hash so no run can disturb another |
| **4** | Isolation moves from prompt rules to worktrees | A build ban violated 158 times, guarding a collision never observed → hardlinked worktrees for concurrent writers, nothing for readers                 |
| **5** | One way to make a worktree                     | Four disagreeing mechanisms, none callable by a session → one MCP tool, one location, `.claude/worktrees` forbidden                                    |

**1 and 2 are the correctness work. 3 is the speed work. 4 and 5 are the isolation work**, and they ship together
because 5 is what guarantees a worktree actually has 4's properties.

### J1. The five pivots

#### Pivot 1 — Resolution moves from `dist` to source

**Today** every check resolves `@dungeonmaster/*` into `packages/*/dist`: typecheck through project references, lint
through the same tsconfigs, jest through the `require` export condition, e2e through its test tooling. So four checks
depend on an artifact that only one check produces, and when that one check is out of scope they grade whatever the last
builder happened to leave.

**After**, a `paths` map in the base tsconfig points TypeScript at `packages/*/src`, and a `source`
export condition points jest at the same place. `dist` stops being a verification input.

Measured: **zero errors and zero `dist` files** for a 13-package source program (E7); **1.00× and 1.13×** cold for jest
on the two biggest packages with all 1,082 tests passing (E4b); **0.93×** for lint (E8). The largest package in the
repo, `packages/web`, has run this way in production the whole time and is green (A7).

#### Pivot 2 — Ward stops writing

**Today** typecheck is `tsc -b` — build mode. It emits into every `outDir`, writes a `.tsbuildinfo`, and
`projectReferencesSyncBroker` rewrites `tsconfig.json` files before it runs. In a consumer's repo it inserts
`composite: true`, creates a root config that did not exist, and **destroys a root config that has comments** (C5). It
also emits test files into `packages/cli/dist`, where they outnumber the real output and get published (A6).

**After**, typecheck is a set of `--noEmit` programs and `projectReferencesSyncBroker` is deleted.

**How many programs, and which packages in each, is DERIVED — never a package name.** This repo already forbids
name-based detection elsewhere (e2e eligibility is resolved "from `packageType`
signals, never a package name"), and the same rule applies here, because a consumer repo may have no UI package, or
three, and none of them called `web`.

The discriminator is **what a package's `compilerOptions` mean for checking**. Group packages whose resolved options
agree; give each distinct group its own program. Emit-only options —
`rootDir`, `outDir`, `declaration`, `declarationMap`, `composite`, `incremental`, `tsBuildInfoFile` — are irrelevant
under `--noEmit` and must **not** split a group. The ones that matter are `jsx`, `lib`,
`target`, `module`, `moduleResolution`, `types`, and the strictness family.

Run against this repo, with no name anywhere in the derivation **[measured: `tmp/program-grouping-probe.cjs`]**:

| Group | Packages                | Why it is separate                                                    |
|-------|-------------------------|-----------------------------------------------------------------------|
| 1     | the 13 backend packages | `lib: [es2022]`, `module: CommonJS`                                   |
| 2     | 1 package               | `jsx: ReactJSX`, `lib: [es2022, dom, dom.iterable]`, `module: ESNext` |

**2 programs**, which is exactly the split E7 and A7 measured. A UI package cannot join the backend group because the
DOM lib would let `document` typecheck inside a node package — a real loss of checking, not a preference.

**This scales to any repo shape.** One group means one program. Three UI packages with matching configs share one. Every
package different means one program each, which is simply the per-package path.

**And a wrong grouping costs time, never correctness.** Per-package `--noEmit` is always valid — it is what
`packages/web` does in production today (A7). Grouping only avoids re-parsing shared source once per package. So the
derivation is an optimisation over a correct baseline, and it cannot produce a wrong verdict if it gets the grouping
wrong.

**Each config file gets exactly one job, which is one fewer than `tsconfig.json` has today.** Ward's rule everywhere
becomes *read `tsconfig.json`, `--noEmit`, touch nothing* — no composite-aware path and no consumer-aware path to
maintain, because there is only one path.

#### What each file holds, here and elsewhere

**This repo — root `tsconfig.json`.** It is the carrier every package `extends`.

| Field                                               | Today | After       | Why                                                   |
|-----------------------------------------------------|-------|-------------|-------------------------------------------------------|
| `compilerOptions` (target, module, lib, strictness) | ✔    | ✔          | unchanged                                             |
| `noEmit: true`, `files: []`                         | ✔    | ✔          | already a checking-only root                          |
| **`references: [13 packages]`**                     | ✔    | **removed** | this is what makes checks read `dist`                 |
| **`paths` → source**                                | ✘    | **added**   | generated from each `package.json`'s `exports.source` |

**This repo — per-package `tsconfig.json`.** The file ward and editors read.

| Field                                                            | Today | After         | Why                                          |
|------------------------------------------------------------------|-------|---------------|----------------------------------------------|
| `extends` the root, `include` (**tests in**)                     | ✔    | ✔            | keeps tests typechecked and linted           |
| `typeRoots`, and semantic overrides such as `jsx`/`lib`/`module` | ✔    | ✔            | these decide program grouping                |
| `composite`, `references`                                        | ✔    | **moved out** | emit-mode machinery                          |
| `outDir`, `rootDir`, `declaration`, `declarationMap`             | ✔    | **moved out** | emit-only                                    |
| `incremental`, `tsBuildInfoFile`                                 | ✔    | **moved out** | and the buildinfo stops living inside `dist` |

**This repo — per-package `tsconfig.build.json`.** New for 12 packages; `cli` and `eslint-plugin`
already have one.

| Field                                                                                                             | Contains                       | Why                                        |
|-------------------------------------------------------------------------------------------------------------------|--------------------------------|--------------------------------------------|
| `extends: "./tsconfig.json"`                                                                                      | —                              | one source of truth for semantics          |
| `composite`, `references`, `outDir`, `rootDir`, `declaration`, `declarationMap`, `incremental`, `tsBuildInfoFile` | everything the row above moved | this is where emit lives now               |
| `exclude: ["**/*.test.ts", …]`                                                                                    | **tests out**                  | fixes A6 — test code stops being published |

Each package's `build` script becomes `tsc -p tsconfig.build.json`. **Ward never reads this file.**

#### What a consumer repo needs — and the answer is nothing new

|                                 | Consumer needs               | Who provides it                                                                                        | Changes under Pivot 2?                                                                                                                                                                               |
|---------------------------------|------------------------------|--------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Root `tsconfig.json`**        | yes, as an `extends` carrier | **`dungeonmaster init` already writes it, and skips if one exists** — `InstallCreateTsconfigResponder` | **No.** Its template is already `extends` the published base + `noEmit: true` + `files: []`, with no `references` and no `composite`. **It is already the shape Pivot 2 wants**                      |
| **Per-package `tsconfig.json`** | yes, to be typechecked       | **theirs** — init has never written these                                                              | No. A package without one is skipped, which is today's behaviour                                                                                                                                     |
| **`tsconfig.build.json`**       | **no**                       | —                                                                                                      | Their build is their own business; ward does not run it                                                                                                                                              |
| **`paths` → source**            | **no**                       | —                                                                                                      | **Source resolution is this repo's config choice, not something ward does to you.** A consumer's `@dungeonmaster/*` come from `node_modules` with published `dist`, which is correct and should stay |

**So `dungeonmaster init` grows nothing.** Today it creates, only-if-absent, a root `tsconfig.json`, a root
`jest.config.js`, a `playwright.config.ts` and devDependencies. That list is unchanged. Ward's own install still does
one thing: add `.ward/` to `.gitignore`.

**What changes is that ward stops writing at RUN time.** Every tsconfig mutation in this repo comes from one place —
`projectReferencesSyncBroker`, called from `commandRunBroker` — and deleting it removes the only run-time writer.
Creation stays where it belongs, at install time, non-destructive, skipping anything that already exists.

**The root `tsconfig.json` stays — it was never ward's file. Its current SHAPE is.**

Ward itself needs no root config to function: under per-package or grouped `--noEmit` it builds its program from the
package configs it read. But three things unrelated to ward need the file to exist **[measured]**:

1. **All 14 packages `extends` it.** It is the shared-options carrier.
2. **Its `ts-node` block** — `{ transpileOnly: true, compilerOptions: { module: "commonjs" } }` — is what lets
   `eslint.config.js:2`'s `require('ts-node/register')` load the plugin `.ts` sources at all.
3. IDEs use it for project-wide resolution.

**What the pivot commit added, versus what predates it** — `git show 99fbf9984^:tsconfig.json`
against today:

| Key                                                 | Before `99fbf9984` | Today       | Whose                                                 |
|-----------------------------------------------------|--------------------|-------------|-------------------------------------------------------|
| `compilerOptions`, `exclude`, `extends`             | ✔                 | ✔          | everyone's                                            |
| `ts-node`                                           | ✔                 | ✔          | the eslint config's                                   |
| **`include`** — 4 globs over every package's source | ✔                 | **removed** | it was a real whole-repo program                      |
| **`references`** (13 entries)                       | ✘                 | **added**   | **`tsc -b`'s**                                        |
| **`files: []`**                                     | ✘                 | **added**   | **`tsc -b`'s** — this is what makes it solution-style |
| `composite: false`                                  | ✘                 | added       | `tsc -b`'s                                            |

So the file predates the build machinery, and the build machinery hollowed it out: it went from a config that checked
the whole repo to **an empty router that checks nothing**.

**Pivot 2 removes exactly the three keys that commit added** and adds `paths`. Whether `include` comes back is a free
choice: ward does not need it, because it writes its own program config into `.ward/`. **But restoring it returns the
root to its pre-pivot shape and makes a bare `tsc --noEmit` at the repo root work again for a human or an IDE** — which
it did before the pivot and does not today.

#### What `--noEmit` actually writes, and where

**`--noEmit` writes no `.js` and no `.d.ts` — that is the point.** But it is not zero artifacts, and the earlier wording
glossed that. Two things go to disk, both into `.ward/`, which is uncommitted and which ward's own installer already
gitignores (D2):

| Artifact                           | Why it exists                                                                       | Today it lives                                                  |
|------------------------------------|-------------------------------------------------------------------------------------|-----------------------------------------------------------------|
| The generated program `tsconfig`   | grouped programs need a config to be built from                                     | nowhere — ward does not do this yet                             |
| **The incremental `.tsbuildinfo`** | **not optional** — it is what takes typecheck from 17.1s cold to **3.7s warm** (E7) | **inside `dist/`**, as `tsBuildInfoFile: "./dist/.tsbuildinfo"` |

**Moving the buildinfo out of `dist/` fixes a second thing B4 records:** today `build:clean`'s
`rm -rf packages/*/dist` throws the incremental state away along with the output, so every clean build also pays a cold
typecheck.

#### Every cache in ward, and why they are NOT all in `.ward/`

`.ward/` takes the two tsc artifacts and nothing else. The four tools do not share a cache directory, and consolidating
them would be a mistake — because they split on whether a cache **must be isolated per tree** or **should be shared
across trees**.

| Tool       | Cache                    | Today                                    | After          | Per-tree or shared?                                                                                       |
|------------|--------------------------|------------------------------------------|----------------|-----------------------------------------------------------------------------------------------------------|
| **tsc**    | `.tsbuildinfo`           | `packages/*/dist/.tsbuildinfo`           | **`.ward/`**   | **Per tree.** It records file versions for *this* tree's files, so sharing it across trees is meaningless |
| **tsc**    | generated program config | does not exist                           | **`.ward/`**   | **Per tree.** Derived from this tree's package configs                                                    |
| **jest**   | transform cache          | `/tmp/jest_rt`, 2.2 GB                   | **unchanged**  | **Should be SHARED.** Identical source transforms to identical output whatever tree it sits in            |
| **eslint** | none                     | —                                        | **still none** | Parked permanently (J4)                                                                                   |
| **vite**   | dep pre-bundle           | `packages/web/node_modules/.vite-<port>` | **unchanged**  | **Per run**, by design — the port suffix is what lets two e2e runs proceed at once                        |

All of these satisfy D2 — none is committed. `/tmp` is uncommitted by definition, `.ward/` is gitignored by ward's own
installer, and `node_modules` is gitignored.

#### Does anything bleed between trees? No — and the earlier "share the jest cache" idea was wrong

**Today nothing bleeds, and the mechanism is the file path.** ts-jest's cache key includes the absolute filename as well
as the content **[measured: `tmp/jest-cachekey-probe.cjs`]**:

|                                  | key                |
|----------------------------------|--------------------|
| same content, main checkout path | `79b393a016a721c2` |
| same content, worktree path      | `253f959635ac990b` |
| changed content, same path       | `aee6536019a03188` |

**So a worktree cannot read the main checkout's entries, and a change in one tree cannot reach another.**

#### Why hardlinking does not fix the cold cost

Hardlinking brings across whatever is in `node_modules`. **The jest transform cache is not in
`node_modules`** — it is in `/tmp/jest_rt` — so hardlinking never touches it.

**And copying the cache into the worktree would not help either.** Its entries are filed under the main checkout's
absolute paths, and the worktree's files are at different paths, so it would look up keys that are not there. **This is
a key problem, not a location problem, which is why no amount of linking or copying reaches it.**

Compare with `dist`, which *is* fixable by copying, because nothing about it is keyed on anything — 1.57s to seed all of
it, replacing a ~60s build (Pivot 4, consequence 2).

#### Correcting an earlier claim: the path key is not protecting you

An earlier draft said the ~350s "IS the isolation". **That overstated it, and the measurement says so.** Inside a
**single** tree, with no worktrees anywhere, changing a sibling module does **not**
change the importing file's cache key **[measured: `tmp/cachekey-sibling-sensitivity.cjs`]**:

|                                               | key                                |
|-----------------------------------------------|------------------------------------|
| sibling is `export const enum E { A = 42 }`   | `da789c1b37ad416d`                 |
| sibling changed to `export enum E { A = 42 }` | `da789c1b37ad416d` — **identical** |

The cached emit is `exports.v = 42`, inlined. After the sibling changes, the correct emit is
`const dep_1 = require("./dep"); exports.v = dep_1.E.A;` — and the cache serves the old one.

**So ts-jest's transform cache is already unsound for cross-file type dependencies, today, with one tree.** The absolute
path in the key prevents *cross-tree* reuse, but it is not guarding you against a hazard you are otherwise safe from —
you are already exposed within a tree.

**Sharing across trees is still the wrong call, but for a smaller and more honest reason:** it widens the blast radius
rather than creating a new failure. Within one tree a stale entry clears the moment the importing file changes, and it
is a tree you are actively working in. Across trees, tree B gets poisoned by tree A's compile of code tree B never had,
and nobody in tree B has any reason to look.

#### What the ~350s actually is, and when a worktree pays it

**It is a full `--only unit` sweep of all 14 packages** (E12a). A sub-agent's worktree running a scoped check —
`--only lint,unit -- <its own files>` — transforms those files and what they import, not the repo. **The 350s is the
ceiling, not the per-worktree bill**, and how close a given worktree comes to it depends entirely on how wide its checks
are. Nobody has measured a scoped worktree's cold cost. **[open]**

**And a naively content-keyed shared cache, which G21 originally proposed, would genuinely bleed.**
ts-jest compiles with a full `ts.Program`, so emit can depend on a **sibling module's types**, not only on the file's
own bytes. Byte-identical importer, one differing sibling **[measured: `tmp/emit-sibling-test2.cjs`]**:

| Sibling                          | Emitted JavaScript                                       |
|----------------------------------|----------------------------------------------------------|
| `export const enum E { A = 42 }` | `exports.v = 42 /* E.A */;` — inlined, **no `require`**  |
| `export enum E { A = 42 }`       | `const dep_1 = require("./dep"); exports.v = dep_1.E.A;` |

The importer's bytes and tsconfig are identical in both, **so a content-only key collides and one tree would execute the
other tree's compiled output.** Exactly the failure worktrees exist to prevent, and it would be silent.

A second, smaller leak sits underneath it: the emitted source map embeds the absolute path, so even where the JavaScript
matches, a shared entry would point stack traces and coverage at the wrong tree.

**So the rule is narrower than "shared caches stay out of `.ward/`". It is:**

> **A cache may be shared across trees only if everything that changes its output is in its key.**
> For jest's transform cache that includes the sibling module graph — which is most of the repo — so
> in practice it cannot be safely shared, and keying on the path is the correct behaviour.

**G21 is therefore withdrawn as stated.** The ~350s is the honest price of a worktree, not a defect. The one thing that
would make the emit tree-independent by construction is `isolatedModules`, which compiles each file without a program —
and F3 records that as **closed off**, because this repo's own proxy-mock AST transformer requires a `ts.Program`. Those
two findings sat apart in this document and are the same constraint.

#### What that means for worktrees — nothing, and that is the good answer

**Each worktree already has its own `.ward/`.** Five exist on disk right now. So each worktree gets its own buildinfo by
construction, and worktrees were never the collision case.

**The collision case is two runs in ONE tree, and it is not a correctness problem
[measured: `tmp/buildinfo-robustness.cjs`]:**

| Buildinfo state                 | Result                       |
|---------------------------------|------------------------------|
| clean                           | 378 files checked            |
| warm, unchanged                 | 0 files checked              |
| **corrupt (garbage bytes)**     | **378 re-checked, no crash** |
| **truncated (a partial write)** | **378 re-checked, no crash** |
| **empty (zero-length)**         | **378 re-checked, no crash** |

TypeScript falls back to a full re-check whenever it cannot read the buildinfo, and it validates file versions against
actual content rather than trusting the record. **So two concurrent runs sharing one buildinfo degrade to cold. They do
not corrupt, and they cannot produce a wrong verdict.** That answers G6: no lock is needed, and a per-run path is an
optimisation rather than a safety requirement.

**This pivot is justified entirely by correctness.** It removes a data-loss bug from a published package and stops test
code shipping to npm. It makes no speed claim, because `tsc -b`'s actual duration is recorded nowhere (see E7's
correction box).

##### Pivot 2 keeps tests typechecked and linted — and fixes the reason they leak into `dist`

Tests must stay lintable and typecheckable. They do, and the split above is what guarantees it: the **tests-included**
config is the one ward reads, and the **tests-excluded** config is the one that emits.

Measured on the E7 program **[measured: `tmp/tests-included-probe.cjs`]**:

| In the checking program    | Count     |
|----------------------------|-----------|
| `*.test.ts` / `*.test.tsx` | **2,375** |
| `*.integration.test.*`     | 110       |
| `*.proxy.ts`               | 905       |
| `*.stub.ts`                | 630       |
| `*.harness.ts`             | 22        |
| **errors, anywhere**       | **0**     |

Lint is covered by the same file: E8's end-to-end run linted all 1,443 files in
`packages/orchestrator`, its 517 test files among them, and passed at 0.93× the `dist` cost.

**Today's arrangement is the broken one.** `tsc -b` drives `tsconfig.json` — the tests-included config — for *emit*,
which is exactly why 79 test, proxy and stub files sit in `packages/cli/dist` against 50 real ones, published (A6).
After the pivot, tests are checked by the config that checks and skipped by the config that emits.

#### Pivot 3 — Derived inputs are hashed, and rebuilt only when they change

**Today** the e2e suite serves the app through the Vite **dev** server. Every `page.goto` pulls 404 uncached requests
and 13.4 MB, 412 times.

**After**, ward hashes the bundle's inputs, rebuilds only when that hash changes, and stores each bundle at a path named
after its hash — so a run already in progress can never have its bundle rewritten underneath it.

> **CORRECTED. An earlier draft said "rebuild unconditionally, every run". That was wrong.** It makes
> ward's behaviour depend on nothing useful, and it breaks the case parallel agents create — several
> of them running ward on one e2e spec each — because `packages/web/vite.config.ts` sets
> `outDir: 'dist'` with no `emptyOutDir` override, so **vite empties that directory before writing**
> **[source]**. One run would delete the bundle another is serving.
>
> A second draft proposed picking the mode from the number of tests in scope. **Also wrong** — test
> count is a proxy for "is the build worth it", and the real question is "has anything changed".

#### What an e2e run is made of, and which parts need building

An e2e run is not just the UI. Three things start, and **only one of them is the bundle**
**[source, verified in `packages/web/playwright.config.ts` and `packages/server/package.json`]**:

| Part                                                               | How it starts                                                           | Reads                                                                                                 | Needs a build?                                                      |
|--------------------------------------------------------------------|-------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------|
| **The API server**                                                 | `tsx --conditions=source bin/server-entry.ts`                           | **TypeScript source**, and its `@dungeonmaster/*` imports resolve to source too, because of that flag | **No — and it never has**                                           |
| **The app in the browser**                                         | `npm run dev:no-watch --workspace=<ui pkg>` — the Vite dev server today | source                                                                                                | **Only under Pivot 3**, which replaces the dev server with a bundle |
| **Playwright's config loader, and its spec and harness transform** | plain Node CJS, **no `--conditions`**                                   | `dist`                                                                                                | **Yes — `shared` and `testing`** (E5a)                              |

**So the server half of e2e is already doing what Pivot 1 proposes.** `tsx --conditions=source` is the same mechanism as
the jest `source` condition, running in production today. That is why parking
`packages/server/dist` and `packages/orchestrator/dist` entirely still gave 5 of 5 passing specs (E5a).

**How many of each is the consumer's business, with one exception that is ward's.** The `webServer`
array in `playwright.config.ts` belongs to the repo being tested, not to ward. It can list one process or five;
Playwright starts them all, and ward — which only spawns `playwright test` — has no opinion.

**The exception is ports, and ward hardcodes exactly two** **[source: `check-run-e2e-broker.ts`]**:

| What ward hands the run  |                                                                 |
|--------------------------|-----------------------------------------------------------------|
| `DUNGEONMASTER_PORT`     | the first free port                                             |
| `DUNGEONMASTER_WEB_PORT` | the second                                                      |
| teardown                 | `netKillPortAdapter` on those two                               |
| the adapter itself       | `netFreePortPairAdapter`, returning `{ firstPort, secondPort }` |

**A repo whose suite needs a third free process has no way to get a third port from ward.** That is a limitation in ward
today, not something this pivot introduces, and it is the same class of assumption as naming a bundle directory after a
package. Recorded rather than designed here — the fix has to decide who owns the count, and the honest options are a
number in `.dungeonmaster.json`, or ward handing out an indexed set and the consumer's config taking what it needs.
**[open]**

**Two separate build needs, and they must not be conflated:**

1. **The bundle** — hashed and rebuilt as described below. This is what Pivot 3 is about.
2. **`shared` and `testing`** — needed by the test *tooling*, not by the app. `shared` measures 1.9s to build
   incrementally (E4c); `testing` is unmeasured but comparable. These are the residual `dist`
   dependency E5a found and G12 tracks, and no bundle hashing addresses them.

#### How ward decides whether to build the bundle

**Hash the inputs. Rebuild only when the hash changes. Name the bundle after its hash.**

**Which inputs — the transitive workspace dependency closure of the package being bundled, not the whole repo.** Walk
that package's `package.json` dependencies, follow each workspace one to its own dependencies, and keep going. Hash the
`src` of every package that walk reaches, plus each of their package.jsons and tsconfigs, the vite config, the entry
HTML, and the lockfile.

**That answers the transitive question directly.** If the bundled package depends on `config` and
`config` changes, the hash changes and it rebuilds. If `config` imports a third package and *that*
changes, the hash changes too — because the walk is transitive, so the third package is already in the set. Nothing
needs to be enumerated by hand.

**Narrowing to the closure matters, and here is the measurement** **[measured]**:

|                                               | Files                              |
|-----------------------------------------------|------------------------------------|
| The e2e-eligible package's transitive closure | **3,059**                          |
| Every package's `src`                         | 7,520                              |
| **Cannot affect the bundle**                  | **4,461 — 59% of the source tree** |

Hashing the whole repo instead would rebuild the bundle every time anyone touched
`orchestrator`, `server`, `mcp`, `ward` or seven other packages that the bundle never sees. **That is 10.4s wasted on
most edits in this repo.**

Hashing cost is not the constraint either way **[measured: `tmp/bundle-hash-probe.py`]** — SHA-256 over the whole
7,552-file superset takes **0.10s**, against a 10.4s build. So use content hashes rather than mtimes and avoid their
false positives after a checkout; the saving from narrowing is about avoiding rebuilds, not about hashing faster.

**Why the closure is safe, and where it is not.** You cannot import from a package you have not declared — this repo
lint-enforces exactly that with `@dungeonmaster/enforce-import-dependencies`. In a consumer repo without such a rule, an
undeclared cross-package import would sit outside the hash and could go stale. **[open]**

Two alternatives were considered and rejected. **Hashing everything** is sound but wastes a build on 59% of edits.
**Hashing the module graph vite recorded last time** is tighter still, but it breaks on anything that changes the graph
without editing a file already in it — a `import.meta.glob` picking up a new file, or a new `foo/index.ts` shadowing an
existing resolution.

#### Why this cannot interrupt a run that is already going

**Each bundle lives in its own package's `.ward/bundle/<hash>/` — no fixed package name anywhere.**
Ward already writes `packages/<pkg>/.ward/run-*.json`, and 14 of those directories exist today, so this follows a
convention that is already in place and already gitignored.

Which packages get a bundle is resolved the same way e2e eligibility already is, from `packageType`
signals rather than a name (`architecturePackageE2eEligibleDetectBroker`). A repo with three UI packages gets three
bundles, each in its own package. A repo with none gets none, and never runs this code at all.

Naming the directory after the hash rather than a fixed path is what removes the collision instead of managing it:

| Situation                                        | What happens                                                                                                                                                                    |
|--------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| A run starts, nothing changed since the last one | The hash matches an existing bundle. **No build. It is served read-only.**                                                                                                      |
| A second run starts while the first is serving   | Same hash → it shares the same finished bundle. Different hash → it builds into a **different directory**. Either way **nothing writes the path the first run is serving from** |
| Two runs start at the same new hash together     | Each builds into its own temp directory, then renames into `<hash>/`. Rename is atomic; whoever loses discards its temp copy and uses the winner's                              |

**Nothing ever writes into an existing `<hash>/` directory.** That is what makes a run in progress untouchable, and it
needs no lock and no queue.

Old hashes accumulate and are pruned on a TTL, exactly as ward already prunes `.ward/run-*.json` and stale vite caches.

#### Why this hash is sound, when the ESLint one was not

J5 rejects an ESLint cache because no key can cover everything that changes a lint verdict. **This hash is the opposite
case: it covers every input to the build.** A matching hash means vite would produce identical output, so reusing it is
not a guess. That is the difference between a complete statement of the inputs and a proxy for them.

The same rule covers the narrow `dist` that e2e's *tooling* still needs: build `shared` and `testing`
alongside the bundle, at 1.9s each. e2e keeps a `dist` dependency; it stops being a stale one.

**The general form, and it is the rule that decides the awkward cases:** a derived artifact may be a verification input
only if the same command regenerates it or fails loudly when it is stale. Never read it and hope.

#### Pivot 4 — Isolation moves from prompt rules to worktrees

**Today** a prompt ban tries to stop sub-agents colliding over `dist`. It was violated 158 times, and the collision it
guards against was never actually observed. The one race that *was* observed is two agents reading and writing the same
**source** file, which the ban does nothing about.

**After**, concurrent *writers* get a worktree each. Concurrent *readers* simply run, because E11 found nothing to
protect across ~30 concurrent runs. The ban is deleted rather than hardened, once Pivot 2 removes the last thing it
could be arguing about.

**A worktree's `node_modules` is populated by hardlink — `cp -al` — which is decision D3.** That is the mechanism the
whole pivot rests on, so it is stated here in full rather than referred to.

**Why hardlink and not the alternatives.** Four strategies were built into real worktrees and measured (E6):

| Strategy             | Setup     | Incremental disk | New package stays local | **Main upgrades → worktree keeps its old version** | Runs its own binaries |
|----------------------|-----------|------------------|-------------------------|----------------------------------------------------|-----------------------|
| symlink-all (today)  | 0.01s     | ~3 MB            | yes                     | **no — leaks instantly**                           | **no**                |
| symlink, real `.bin` | 0.02s     | ~3 MB            | yes                     | **no — leaks instantly**                           | yes                   |
| **hardlink (D3)**    | **0.65s** | **20.4 MB**      | **yes**                 | **yes**                                            | **yes**               |
| full copy            | 6.65s     | 532 MB           | yes                     | yes                                                | yes                   |

**Only hardlink and full copy meet the isolation requirement**, and hardlink costs 26× less disk and 10× less time. The
upgrade test simulated what npm actually does — remove the package directory, re-extract — which breaks the hardlink and
leaves the worktree holding its own inode. A symlink follows the replacement and the worktree silently changes versions
underneath a session that is running against older code.

**Three things fall out of it, and two of them are why this pivot works at all:**

1. **`.bin` becomes a real directory, so a worktree runs its OWN ward, hooks and CLI.** npm's shims are relative —
   `dungeonmaster-ward` is `../@dungeonmaster/ward/dist/bin/ward-entry.js` — so where they land depends only on whether
   `.bin` is a real directory or a symlink to the main checkout's. Today it is a symlink, and **every worktree on disk
   runs the main checkout's binaries** (C6a). Hardlinking fixes that as a side effect, which is what makes C4 and C6
   solvable.
2. **A worktree may need its `dist` seeded, and the rule for deciding is uniform.**

   **The mechanism is ONE mechanism, in this repo and in every consumer repo.** Whenever the orchestrator or an agent
   mints a worktree, it does the same three things, against the root of whatever repo it is running in:

    1. `git worktree add`
    2. hardlink `node_modules` from that repo's root
    3. re-point every `@dungeonmaster/*` entry whose realpath sits under `<root>/packages/`, so it points at the
       worktree's own package instead of the main checkout's

   **A fresh worktree can end up with source but no compiled output, and then ward cannot run, because ward's own binary
   IS compiled output.** Two things each fail to bring it across:

    - `git worktree add` checks out **tracked** files. `dist` is gitignored, so it is not tracked, so it is not there.
    - `cp -al` of `node_modules` does not help either, because in this repo
      `node_modules/@dungeonmaster/ward` is a **symlink pointing at `packages/ward`**. Copying a symlink copies the
      pointer, not the compiled files behind it.

   The fix is to **copy the built `dist` folders in from the main checkout** — 1.57s, against a ~60s build. Call that
   *seeding*.

   **Whether a worktree needs seeding is decided by step 3's own outcome, never by which repo it is**
   **[measured]**:

   | If step 3 re-pointed… | then `@dungeonmaster/*` lives in… | and `dist` is… | so |
      |---|---|---|---|
   | **nothing** | `node_modules`, as real directories installed from npm with `dist/` already inside | **already there**, hardlinked across with everything else | **no seeding — ward runs immediately** |
   | **every entry** | `packages/*`, as workspace symlinks | **missing**, for the two reasons above | **seed the packages it re-pointed** |

   Today the first row is every consumer repo and the second is this one. **But nothing in the code asks which repo it
   is** — it asks what step 3 did. A consumer who is themselves a monorepo gets the same treatment for their own
   packages, from the same code.

   **Seed by COPY, never by hardlink — and this is not a preference** **[measured]**. Compilers truncate-write the same
   inode, so a hardlinked `dist` would push a worktree's rebuild straight back into the main checkout. Proven directly:
   `fs.writeFileSync` over one hardlinked file changed the other. **`dist` is precisely the directory tools write in
   place**, which is G15's hazard made concrete. A copy gets separate inodes and is safe.

   **And it is cheap, which retires the "unmeasured bootstrap build" this doc has been carrying**
   **[measured]**:

   | | Size | Time |
      |---|---|---|
   | `cp -a` every package's `dist` | 43.9 MB | **1.57s** |
   | `cp -a` just `ward` + `shared` — the minimum for ward to run | 9.1 MB | **0.13s** |
   | *(for comparison)* a cold `npm run build` | — | 55.1s, 60.7s, 71.3s |

   **So the seed replaces a ~60s build with about 1.5 seconds.** A worktree that then edits one of those packages
   rebuilds that package alone — measured at 1.9s for `shared` (E4c) — rather than the repo.

   One correctness note: a seeded `dist` reflects the source at seed time, and `git worktree add HEAD`
   starts the worktree on that same commit, so it is correct at creation. After Pivot 2 nothing reads
   `dist` for verification anyway; the only consumers left are ward's own binary and the e2e tooling.
3. **Inodes are not a constraint.** 57,639 per worktree against 23.1 million free — room for about 400.

#### Symlinks that survive a hardlink populate — 86 of them, and none can bleed

D3 replaces the 537 symlinked packages with real hardlinked files. **Some links remain, and they are not an oversight —
two of them cannot be anything else** **[measured]**:

| Remaining link                                               | Why it cannot be a hardlink or a copy                                                                                                                                                                                                                               |
|--------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `node_modules/@dungeonmaster/<pkg>` → `../../packages/<pkg>` | **You cannot hardlink a directory.** And a *copy* would be actively worse: editing `packages/ward/src/foo.ts` in the worktree would then be invisible through `@dungeonmaster/ward`, so the worktree would grade a frozen snapshot of its own source — a self-bleed |
| `node_modules/.bin/*` and nested `.bin/*`                    | npm's own shim format is a relative symlink into a sibling package. Making them real files would break the moment a package updates                                                                                                                                 |

**Audited every one on a real hardlinked worktree** **[measured]**:

|                                   |        |
|-----------------------------------|--------|
| symlinks surviving the populate   | **86** |
| resolving **inside** the worktree | **86** |
| resolving **outside** it — bleed  | **0**  |
| targets that are **relative**     | **86** |
| targets that are **absolute**     | **0**  |

**What decides whether a symlink is safe is how it is written, not whether it exists at all:**

| A symlink written like this                        | Points at                                  | Safe?                                                                                     |
|----------------------------------------------------|--------------------------------------------|-------------------------------------------------------------------------------------------|
| `../../packages/ward`                              | the worktree's own copy of `packages/ward` | **Yes.** A path that starts with `../` can only walk around inside the tree it started in |
| `/home/…/codex-of-consentient-craft/packages/ward` | the **main checkout**                      | **No.** The worktree now builds and grades code it never changed, and reports green       |

The second form is what a hand-rolled populate produces, and it is trap 2 above.

**You can check for it in two lines.** After building a worktree, walk its `node_modules` and confirm two things about
every symlink you find: the target does not start with `/`, and following the link lands somewhere inside the worktree.
This repo's populate passes both today — 86 symlinks, all relative, all landing inside. It is worth checking on every
populate anyway, because when it does go wrong nothing tells you: the run is green and it graded the wrong tree.

**The carried risk, and it is the only one.** Hardlinked files share an inode, so a tool that edits a file **in place**
inside `node_modules` changes both trees. npm does not work that way — it removes and re-extracts — but a patch script
would, and nobody has swept for one (G15). Also `cp -al` cannot cross filesystems, which is fine on this single ext4
volume and would break for a worktree placed on another mount.

**Two implementations change together**, and both must keep the traps C3 documents: exclude
`.vite-*`, and re-point every `@dungeonmaster/*` at the worktree's own packages, or the worktree silently builds and
grades the main checkout's code. They are `tmp/pm-worktree-setup.sh` and
`worktreePopulateNodeModulesBroker`.

#### Pivot 5 — One way to make a worktree, that a session can call

**Today there are at least four ways to get a worktree, they disagree, and none of them is callable by an LLM session**
**[source]**:

| Who makes one                                                    | Where it puts it                                             | Populates `node_modules`?                    | Seeds `dist`?                        |
|------------------------------------------------------------------|--------------------------------------------------------------|----------------------------------------------|--------------------------------------|
| `gitWorktreeAddAdapter` + `worktreePrepareBroker` (orchestrator) | `locationsStatics.repoRoot.worktreesDir` — i.e. `worktrees/` | yes, via `worktreePopulateNodeModulesBroker` | no                                   |
| `hookWorktreeCreateResponder` (hooks)                            | **`.claude/worktrees`**, hardcoded                           | **no**                                       | no — it runs `npm run build` instead |
| `tmp/pm-worktree-setup.sh`                                       | wherever the caller says                                     | yes                                          | no                                   |
| **an agent hand-rolling it**                                     | wherever it likes                                            | **badly**                                    | no                                   |

The orchestrator's adapter already carries the right instinct in its own header — *"Reach for this — never assemble a
`git worktree add` invocation elsewhere"* — and the location already exists as a static. **The pieces are there; nothing
makes anyone use them.**

**The hand-rolled row is not hypothetical.** This session hand-rolled a populate twice, hit trap 1 — seven packages have
their own `node_modules` and missing them fails the build at `vite build` — and had to redo a measurement. An agent that
gets it slightly more wrong gets trap 2 instead, where the worktree silently builds and grades the main checkout's code.

**After: one MCP tool, and it is the only sanctioned route.** A session asks for a worktree by name and gets a path
back. Behind it, in order:

1. `git worktree add` through the existing adapter, so the base-branch invariant it protects still holds
2. populate `node_modules` by **hardlink** (D3)
3. **seed `dist`** for whatever step 2 re-pointed (Pivot 4, consequence 2)
4. verify before returning: every symlink under `node_modules` has a relative target and lands inside the worktree

**One location: `<repoRoot>/worktrees/<name>`**, from `locationsStatics.repoRoot.worktreesDir`.
`installWorktreesScaffoldResponder` already creates and gitignores it at install time, in this repo and in every
consumer.

**`.claude/worktrees` is forbidden.** `hookWorktreeCreateResponder` hardcodes it today, which puts worktrees inside the
harness's own directory rather than the repo's, outside every convention the orchestrator built, and outside whatever
sweeps `worktrees/`. One such worktree is on disk right now. That responder either redirects to the tool above or is
deleted.

**Why this belongs in the pivot list rather than in a cleanup ticket:** every other pivot assumes the worktree it runs
in was built correctly. D3's isolation, Pivot 4's `.bin` fix, the `dist` seed and the relative-symlink guarantee are all
properties of *how the worktree was made*. **A hand-rolled worktree has none of them, and nothing about it looks wrong
until a run comes back green against code it never saw.**

### J2. How each perspective is solved

#### C1 — one agent, parallel sub-agents, one branch and one tree

**The defect today** is that `--only lint,test` is unsatisfiable. It excludes the only check that refreshes `dist` and
includes three that read it, so a sub-agent whose work lives in `shared` cannot turn its test green no matter what it
does. That is why one agent hand-edited `shared/dist/testing.js`
and another was told to rework instead.

**Pivot 1 solves it directly.** Jest reads the source the sub-agent just edited, so the brief becomes sound and the work
becomes provable. **Pivot 2** removes the writer, so the orchestrator's broader
`--changed` pass needs no build in front of it.

**What C1 does not get, stated plainly:** two sub-agents editing the same file still race. Nothing in Pivots 1–3 touches
that. If it matters, C1's sub-agents need a worktree each — Pivots 4 and 5 — and at that point C1 has become C3.

#### C2 — the orchestrator's three layers

**The defect today** is at layer 3, where the post-mortems counted 158 builds, 34 in one work item. Those agents were
not being disobedient: their briefs banned the one check that could make their work provable.

**All five pivots land here at once.** Layer 3 runs the full scoped check set, typecheck included, because typecheck no
longer builds anything. The `[BUILD]` rule is deleted, so there is nothing left to violate. Layer 1's pre-quest full run
gets Pivot 3's e2e saving.

**The honest note:** contention is real and does not disappear. Four concurrent runs took 36.8s against 17.3s solo. That
is a cost to schedule around, not a correctness failure to defend against.

#### C3 — a worktree per sub-agent

**Repositioned.** Its purpose is **write isolation between concurrently-editing agents** — the failure actually
observed — not ward isolation, which E11 shows is unnecessary.

**What it costs, honestly** — Pivot 4 has the mechanism, this is the bill:

|                                                                       |                                                   |
|-----------------------------------------------------------------------|---------------------------------------------------|
| `git worktree add`                                                    | 0.32s                                             |
| `cp -al` of `node_modules` (D3)                                       | 0.65s, 20.4 MB                                    |
| **`cp -a` to seed the `dist` of any package the worktree re-pointed** | **0.13s for `ward` + `shared`, 1.57s for all 14** |
| cold jest transform cache, first full unit sweep                      | **up to ~350s**                                   |

**Getting a worktree ready costs about 1 to 2.5 seconds**, and the seed row replaces the 55–71s build this doc carried
for most of its life. It is zero in any repo where the populate re-pointed nothing, which is every consumer repo today.

**The jest cache is the only large cost left, and three things about it matter:**

1. **Nothing can link or copy it away.** It lives in `/tmp`, not `node_modules`, and its entries are filed under the
   main checkout's absolute paths. It is a cache-key problem, not a location problem.
2. **~350s is a ceiling, not a bill.** That figure is a full `--only unit` sweep of all 14 packages. A sub-agent running
   `--only lint,unit -- <its own files>` transforms those files and their imports, not the repo. **What a real scoped
   worktree pays is unmeasured. [open]**
3. **Sharing a content-keyed cache would cut it and is rejected**, because it widens an unsoundness ts-jest already has
   inside a single tree. Pivot 2 has the measurement.

**What a worktree buys:** each agent edits its own tree, so no agent ever reads a file another is mid-write on — the one
race ever actually observed. Version isolation holds too: a package installed in the worktree stays there, and an
upgrade landing in the main checkout does not reach it until that worktree merges. **Pivot 5 is what guarantees any of
this is true of a given worktree**, since a hand-rolled one has none of these properties and does not look wrong.

#### C4 — dogfooding ward on ward

**The defect today is an accident, not a decision.** A worktree's `node_modules/.bin` is one symlink to the main
checkout's, and npm's shims are relative, so every worktree runs the **main checkout's** ward, hooks and CLI. That is
right for "is ward stable" and wrong for testing a ward change, and nobody chose either.

**Pivot 4 makes it a choice.** With a real `.bin` the worktree runs its own ward by default, and borrowing the stable
one becomes an explicit opt-out rather than a side effect of `ln -s`. **Pivot 5 is what makes that reliable** — a
hand-rolled worktree still borrows the main checkout's binaries, and nothing about it looks wrong.

#### C5 — dungeonmaster published, running ward in a stranger's repo

**The defect today is the most severe thing in this document.** Ward writes `composite: true` and a
`references` array into a consumer's package configs, creates a root `tsconfig.json` they never had, and **deletes the
contents of a root `tsconfig.json` that contains comments** — which is what
`tsc --init` emits. It announces all of it as one line on stderr. Then, having converted their repo, it hands them the
`dist` dependency and the hammering that follows.

**Pivot 2 solves it by deletion.** `projectReferencesSyncBroker` and its ~15 files go, and ward stops touching consumer
source configs at all. A9's gap closes with a `paths` map generated from each
`package.json`'s own `exports.source` field, so nothing has to be authored by hand.

**And it solves it without a second code path.** An earlier draft proposed gating the sync on
`composite === true`, so consumers who never opted into project references would be skipped. That was wrong: it would
leave ward behaving one way here and another way there, and two behaviours are two things to maintain. **Pivot 2 gives
every repo the same treatment — read `tsconfig.json`, `--noEmit`, write nothing — so the gate has nothing left to
gate.** The interim fix is narrower and carries no split: refuse to write a config that failed to parse.

**This perspective alone justifies the whole direction**, because no worktree policy can reach a consumer's repo.

#### C6 — a worktree that changes the instrument

**The defect today is that a `packages/testing` change is half-live and nothing says which half.**
`jest.setup.js` and the transformer glue are read from source and take effect immediately; the middleware behind them
and every `@dungeonmaster/testing` import come from `dist` and do not.

**Pivot 1 closes the import half. Pivots 4 and 5 close the binary half.** The remaining piece is one hardcoded
`require('../dist/src/middleware/…')` in `proxy-mock-transformer.js:17`, which sits on every jest transform in the repo
and must ship *with* Pivot 1 rather than after it.

**What still needs designing:** when the instrument itself breaks, every test fails for one reason and the run says
nothing about regressions. The cheap half is a summary change — when a run comes back near-totally red on a single
repeated error, ward should report **instrument failure**, not N regressions.

### J3. How we know it worked

**Success has two halves, and both must hold.** §K is the full enumeration, read from source; this is the measure.

#### Half one — nothing regressed

**D4 is the only capability that may disappear.** Ward stops building. Everything else behaves identically:

| Surface                      | Must still hold                                                                                                                                                                                                                                                                                                |
|------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Subcommands                  | `detail` and `raw` unchanged, including their error strings. `refs:sync` and `refs:check` **go with the broker** — and because an unknown command exits **0**, a CI job still calling them gets a silent pass. Keep them as stubs that exit 1, or change that exit code                                        |
| Flags                        | Every flag, every rejection message, every legal and illegal combination — including `--committed`/`--uncommitted` rejecting narrowing flags, that pair being legal together, and `--onlyTests` demanding a `-- <files>` scope                                                                                 |
| Check verdicts               | Every pass, fail and skip rule for all five checks, unchanged                                                                                                                                                                                                                                                  |
| Edge verdicts                | Empty scope at exit 0 with no result saved; path-not-on-disk at exit 1; `NO CHECK PROCESSED`; `DISCOVERY MISMATCH`; jest "no tests found" as a skip only in a file scope; a non-eligible package skipping e2e while an eligible one without a config **fails**; a crashed child never loading the previous run |
| Storage, exit codes, summary | Run ids, both save levels, the 7-day prune, codes 0/1/2 with crash winning, and the summary's exact line format                                                                                                                                                                                                |
| Consumer install             | `.gitignore` entries, the four npm scripts, per-cwd binary resolution                                                                                                                                                                                                                                          |

**Four things change on purpose**, and each needs to be re-specified rather than merely allowed to drift: typecheck's
file scope narrows from all packages to the filtered ones; `--only typecheck` goes from spawning zero children to one
per package; a crashed child starts reporting a `typecheck` crash; and ward's own `dist` stops being refreshed as a side
effect of a typecheck run.

#### Half two — these newly hold

Each is measurable today and measurable after, which makes this a test rather than a claim:

|                                                         | Today                                                    | After                                             |
|---------------------------------------------------------|----------------------------------------------------------|---------------------------------------------------|
| `--only lint,test` over an unbuilt `shared` edit        | reports **PASS** against source it never saw             | reports the failure                               |
| Files ward writes outside `.ward/`                      | package and root tsconfigs, plus every `packages/*/dist` | **none**                                          |
| A consumer's tsconfigs after an ordinary `npm run ward` | rewritten — and a commented root config **destroyed**    | untouched                                         |
| Test, proxy and stub files in `packages/cli/dist`       | **79**, against 50 real ones, published                  | **0**                                             |
| `dungeonmaster init`                                    | unchanged                                                | **unchanged** — it already writes the right shape |

#### What was predicted to break, and what the measurement says

| Predicted risk                                | Verdict                                                                                                             |
|-----------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| `DISCOVERY MISMATCH` on typecheck, repo-wide  | **Does not fire.** 0 of 14 packages today, 0 of 14 post-pivot (K5a)                                                 |
| `composite: true` conflicting with `--noEmit` | **No conflict.** Zero config errors, behaviour identical to `composite: false` (K5b)                                |
| Tests dropping out of typecheck or lint       | **They do not.** 2,375 test files, 905 proxies, 630 stubs, 0 errors; lint passes all 1,443 files in `orchestrator`  |
| `check-commands-statics.test.ts`              | **Will fail on the first keystroke** — one `toStrictEqual` over the whole statics object, and it is the entire file |
| `session-snippet-statics.ts:170`              | **Becomes false**, is pinned by a regex test, and **ships into every repo `dungeonmaster init` has touched**        |

### J4. Sequencing

The pivots are not equally urgent and two of them have prerequisites.

| Order | What                                                                                                                       | Why here                                                                                                  |
|-------|----------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------|
| 1     | **Stop the consumer damage** — make the sync broker refuse to write any `tsconfig.json` it could not parse                 | Verified data loss, live, in a published package. One predicate, independent of everything else           |
| 2     | **Fix the cost model** — per-package `durationMs`, stop collapsing with `Math.max`                                         | Nearly free, and every speed decision below is otherwise argued against one package's numbers             |
| 3     | **Pivot 1, jest half** — plus the three hardcoded `dist` paths                                                             | The only change whose whole blast radius is already measured green. Closes the stale-green demo by itself |
| 4     | **Pivot 3** — built e2e bundle, hashed and stored per hash                                                                 | Orthogonal to everything, largest single speed lever, and it makes later iterations cheaper               |
| 5     | **Pivot 1, typecheck and lint half, then Pivot 2**                                                                         | Verify package by package, not as one flip                                                                |
| 6     | **Delete the build ban**                                                                                                   | Only defensible once Pivot 2 has removed the build                                                        |
| 7     | **Pivots 4 and 5 together** — the hardlink rollout and the one worktree entry point — plus `CONCURRENCY_LIMIT` from config | They ship as a pair: Pivot 5 is what guarantees a worktree actually has Pivot 4's properties              |

**The minimum defensible cut is 1 through 4.** That captures the consumer data loss, the stale green in tests, the
largest speed lever and an honest cost model, while leaving lint reading `dist` and typecheck writing it — a coherent
place to stop.

### J5. Deliberately not doing

|                                         | Why                                                                                                                                                                                                        |
|-----------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| An ESLint `--cache`                     | Permanently, not provisionally. Warm is 2.3× but cold costs 26% *more* than none, post-pivot hit rate is near zero, and no sound key exists in either world                                                |
| Compiling the eslint plugins to `dist`  | Buys nothing on the wall — 3.6s inside a ~56s check that is not on the critical path — and hands lint a `dist` dependency while re-breaking C6. Re-scope it to the per-edit hook, where it genuinely hurts |
| Raising Playwright `workers`            | Broke 21 tests on the dev server and 21 again under a built bundle. Load latency was never the blocker. Highest ceiling, least evidence                                                                    |
| A lock or scheduler for concurrent ward | There is nothing to protect                                                                                                                                                                                |

### J6. What a plan still has to decide or measure

Nothing here blocks steps 1 to 4. Each one gates a specific later step.

| Gates                                            | Question                                                              | Why it is not answered here                                                                                                                                                                                            |
|--------------------------------------------------|-----------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Any speed claim about Pivot 2**                | **What does `tsc -b` actually cost?**                                 | It is recorded in no artifact — it finishes before `runStartMs` and its synthesised results carry no duration. **Pivot 2's correctness case needs no such number**, so this only matters if someone argues it on speed |
| **Spending anything on concurrency**             | **The single UI package's unit suite — 304.2s, one package, serial.** | Examined nowhere in this document. **The largest unexamined item here**, and E12's `CONCURRENCY_LIMIT` lever cannot touch it, because concurrency works across packages and this is one package's serial run           |
| **Fan-out onto worktrees**                       | **What does a SCOPED worktree pay in cold jest cache?**               | The ~350s figure is a full 14-package unit sweep. A sub-agent running its own files pays a fraction, and nobody has measured which fraction                                                                            |
| **Pivot 3 in a consumer repo**                   | **What if a repo has an undeclared cross-package import?**            | The bundle hash walks declared `package.json` dependencies. This repo lint-enforces that declarations are complete; a consumer without that rule could have an import outside the hash, and it would go stale          |
| **Pivot 3 in a repo with more than two servers** | **How does ward hand out more than two free ports?**                  | It hands out exactly two, by name. Exists today; the fix has to decide who owns the count                                                                                                                              |
| **Pivot 4 at scale**                             | **Does anything write in place inside `node_modules`?**               | Hardlinking's only failure mode. npm does not; a patch script would. Nobody has swept                                                                                                                                  |
| **C6 being genuinely closed**                    | **What does a canary run look like?**                                 | When the instrument breaks, everything reddens for one reason. The cheap half is a summary change; the rest is undesigned                                                                                              |

---

## K. The regression contract — what must still work

Enumerated from `packages/ward/` source, not from memory. **D4 is the only capability the pivot removes.** Everything
below must behave identically afterwards, or the pivot failed regardless of what it gained.

Rows marked **TOUCHED** are ones the pivot changes on purpose; each says what the new behaviour must be. Everything else
is a straight must-not-change.

### K1. Subcommands — `src/flows/ward/ward-flow.ts:20-72`

| Subcommand                           | Contract                                                                                                  | Touched                                                                                                                                  |
|--------------------------------------|-----------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| *(none)* / `run`                     | Implicit `run`; the flow splices `'run'` in at index 2 so `args.slice(3)` still lands on flags            | **TOUCHED** — two stderr lines go: `ward: synced project references in N tsconfig(s)` and `WARNING: project references cycle detected …` |
| `detail <runId> [filePath] [--json]` | Full detail text or JSON; `No ward result found for run <id>` on an unknown id                            | no                                                                                                                                       |
| `raw <runId> <checkType>`            | Prints each project's `rawOutput`; usage error on a missing arg; `No <checkType> check found in run <id>` | no                                                                                                                                       |
| `refs:sync` / `refs:check`           | Sync writes drifted tsconfigs; check exits 1 on drift                                                     | **TOUCHED — both deleted with the broker**                                                                                               |
| unknown command                      | `Unknown command: <x>` then `Available commands: …`, **exit 0**                                           | **TOUCHED** — the list must lose `refs:sync, refs:check`                                                                                 |

> **A trap worth naming.** An unknown command exits **0**. So any CI job still calling `ward refs:check`
> after the deletion gets a **silent pass**, not a failure. Either keep the names as loud stubs that
> exit 1, or change the unknown-command exit code.

**Also found, unrelated to the pivot:** `ward list` is **not routed**. `WardListResponder` and
`commandListBroker` exist and are unit-tested, and `scripts/ward-smoke-test.ts` invokes it — but
`COMMANDS` has no entry, so `ward list` prints `Unknown command: list` and exits 0.

### K2. Flags — `src/transformers/cli-args-parse/cli-args-parse-transformer.ts`

**None of this is touched.** All of it must still hold:

- `--only` accepts the five check types, expands `test` → `unit,integration,e2e`, accumulates and de-dupes across
  repeats, and is **silently ignored as the last argument**.
- `--onlyTests` requires a trailing `-- <files>`, with the full rationale-plus-usage error; a bare `--`
  does not satisfy it; `--parentScoped` exempts a child ward and is deliberately absent from the unknown-flag list.
- `--committed` and `--uncommitted` reject `--only`, `--onlyTests` and `-- <files>` with an error naming the offenders —
  **checked before the `--onlyTests` rule, so the git-flag error wins** — and legally combine with each other.
- Post-`--` tokens starting with `-` are rejected with the "Ward does not support passing flags to Jest, ESLint, tsc, or
  Playwright" message; a bare positional before `--` is rejected separately.
- Unknown flags print the accepted list plus four "Common mistakes" lines.

> One cosmetic collision: the unknown-flag help names `--noEmit` as an example of a tsc flag ward
> rejects, and `cli-args-parse-transformer.test.ts:711-735` asserts on it. `--noEmit` becomes ward's
> own typecheck flag. The rejection is still correct — users still may not pass it — but the wording
> deserves a second look.

### K3. Check types — `src/statics/check-commands/check-commands-statics.ts:44-94`

| Check                     | Contract                                                                                                                                                                                               | Touched                                                                   |
|---------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------|
| `lint`                    | `eslint --fix --stats --format json .`, trailing `.` swapped for the file list when scoped. Pass ⇔ exit 0, **never skips**. `filesCount` counts entries **after** dropping eslint-ignored results      | no — E8 measured the program change at 0.93× with all 1,443 files passing |
| `typecheck` (per-package) | `tsc --noEmit --listFiles`. Skips with `no tsconfig.json` when absent. **A scoped `fail` is downgraded to `pass` when no error matches a scoped path**                                                 | **TOUCHED — becomes the only path**                                       |
| `typecheckRefs`           | `tsc -b --listFiles`, once, from the root                                                                                                                                                              | **TOUCHED — deleted**                                                     |
| `unit`                    | `jest --json --no-color --forceExit --detectOpenHandles --testPathIgnorePatterns …`; scoped adds `--runInBand --findRelatedTests` when every entry has a dot, else `--testPathPatterns` joined by `\|` | no — E4b measured 566/566 and 516/516 passing                             |
| `integration`             | Same plus `--testTimeout=30000` and an inverted path pattern; **a directory scope rewrites the pattern value in place**                                                                                | no                                                                        |
| `e2e`                     | `playwright test --reporter=line,json`; free port pair never derived; per-port JSON report name; skip when not eligible, **fail when eligible and `playwright.config.ts` is missing**                  | no — E10 measured 410/410 under a built bundle                            |

**`check-commands-statics.test.ts:5-102` is a single `toStrictEqual` over the whole statics object.**
It fails on the first keystroke of the change, and it is the entire file.

### K4. Scoping — all untouched except two rows

Must still hold: single-versus-multi detection; dropping a workspace dir with no `src/`; passthrough normalisation; the
path-existence check running after normalisation and before discovery;
`--committed`'s merge-base derivation; `--uncommitted`'s union with untracked files; the de-dupe on first appearance;
`isSourceFileGuard` dropping `.md` and `.json`; a zero-file git scope returning the config **unchanged** so the
empty-scope short-circuit catches it; `filteredFolders` matching on exact path or `<path>/` prefix; the per-child slice
dropping empty strings so no `--` is forwarded.

| Row                                                | Today                                                                                                        | After                                                                                         |
|----------------------------------------------------|--------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------|
| **Typecheck ignores the file scope in multi mode** | results collected over **all** `projectFolders`, so a one-file scope still reports typecheck for 13 packages | **TOUCHED** — covers only `filteredFolders`, so package and file counts in the summary change |
| **`--only typecheck` spawns zero children**        | `effectiveCheckTypes` empties for every eligible package and the handler returns `null`                      | **TOUCHED** — one child per package, N compilations instead of one                            |

### K5. Edge-case verdicts — the ones this repo leans on

Untouched, and each must still produce its exact output: empty file scope printing
`fileScopeEmptyStatics.message` at **exit 0 with no result saved**; a path not on disk printing
`NO CHECKS RAN` at exit 1; no-files-processed printing `NO CHECK PROCESSED` at exit 1 with typecheck classified `false`,
skips dropped, and crashed results dropped per result; git-derived paths exempt from that; the whole-run
`--onlyTests pattern "X" matched 0 tests in any package`; jest's "No tests found" becoming a skip **only in a file
scope**; zero discovered test files skipping before jest spawns; a scope with no matching tests skipping; a non-eligible
package skipping e2e; an eligible one without a config **failing**; eslint-ignored files filtered from both counters; a
child that wrote no readable result synthesising a failing result rather than loading the previous run; an empty
`projectResults` reading as **pass**, not skip.

| Verdict                                                                  | Touched                                                                                                                                                                            |
|--------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Project-references cycle warning, and the `eligibleCount === 0` fallback | **TOUCHED — both deleted; the fallback becomes the only path**                                                                                                                     |
| `noEmit: true` making a package composite-ineligible                     | **TOUCHED — the eligible/ineligible split disappears and all 14 packages converge**                                                                                                |
| Refs drift writing tsconfigs mid-run                                     | **TOUCHED — this is the write the pivot exists to remove**                                                                                                                         |
| Crashed-child check list                                                 | **TOUCHED (indirect)** — `effectiveCheckTypes` is derived from `preComputedTypecheck` membership, so a crashed child starts reporting a `typecheck` crash it never reported before |

#### K5a. The top predicted risk was measured, and it does not fire

The reviewer ranked **`DISCOVERY MISMATCH` on typecheck, repo-wide** as most likely to break. The mechanism is real:
`checkRunTypecheckRefsBroker` sets `filesCount := discoveredCount`, making the comparison vacuous today, while the
per-package path derives `filesCount` from `--listFiles` output and `discoveredCount` from globbing tsconfig `include`.

Replicating both counters with ward's own transformer and adapter **[measured: `tmp/discovery-mismatch-probe.cjs`,
`tmp/discovery-mismatch-postpivot.cjs`]**:

| Config                                                              | Packages mismatching |
|---------------------------------------------------------------------|----------------------|
| Today's tsconfigs                                                   | **0 of 14**          |
| **Post-pivot** — `paths` → source, `composite`/`references` dropped | **0 of 14**          |

Every package matches exactly, delta 0. **And the post-pivot run shows why it is safe:** each program does pull in
636–1,470 sibling source files, but `filesCount` counts only files under `<cwd>/`, so siblings never enter the count and
the two counters stay locked.

**The risk is real as a mechanism and absent in this repo.** It would return for any package whose tsconfig omits
`include` — the discovery fallback is `src/**` + `bin/**` with **no `test/**`**.

#### K5b. `composite: true` does not conflict with `--noEmit`

TypeScript 5.8 accepts them together with zero config errors and behaviour identical to
`composite: false` **[measured]**. So the pivot can stop ward *writing* references before the fields are removed from
disk; the two steps are independent.

### K6. Results, exit codes and output — untouched

Run id shape and contract; the save path; **both levels saving** in multi mode; `storageLoadBroker`
reading exactly one id and returning `null` on error; `detail`'s sections including `not run (N files)`
from `onlyDiscovered`; `detail --json` ignoring `filePath`; the 7-day prune keeping malformed timestamps; exit codes
0/1/2 with **crash last so it wins**; `process.exitCode` never `process.exit()`; the summary's `run:` line, per-check
line format, `WARN 0 files run`, skipped checks omitted entirely, failing-check detail sections, slow-file sections, and
the `Full error details:` hint.

**Touched:** the typecheck summary line's package count and file counts, via K4.

### K7. Consumer repos — `packages/cli` and `packages/ward` install responders

Untouched: `.gitignore` entries appended per entry; the four npm scripts added only when absent with top-level key order
preserved; per-cwd binary resolution falling back to PATH; discovery patterns covering `.js`/`.jsx` for lint and jest.

|                                                                                                                                             | Touched                                                                                                                                                                                        |
|---------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| A consumer with no `workspaces` never sees the refs machinery                                                                               | no — **this path is already the post-pivot shape**                                                                                                                                             |
| A consumer **with** `workspaces` has its tsconfigs rewritten by an ordinary `npm run ward`, root included, even with zero eligible packages | **TOUCHED — the largest consumer-facing change, and the point**                                                                                                                                |
| `npm run typecheck` in a consumer monorepo currently performs a **build**                                                                   | **TOUCHED — becomes N `--noEmit` compilations**                                                                                                                                                |
| Ward runs from `packages/ward/dist/bin/ward-entry.js`                                                                                       | **TOUCHED** — today a typecheck-inclusive run refreshes ward's own dist as a side effect; afterwards only `npm run build` does. `start-ward.integration.test.ts:101` asserts `wardBinExists()` |

### K8. Code and prose left orphaned

Deleting the refs machinery orphans more than the brokers: `isTsconfigPairDriftedGuard`,
`projectReferencesDeriveTransformer`, `tsconfigUpdateReferencesTransformer`,
`tsconfigReferencesEqualTransformer`, **`relativePathComputeTransformer`** (whose only caller is the derive
transformer), `tsconfigSerializeStatics`, and the `tsconfig-sync-pair`, `tsconfig-reference`,
`tsconfig-json-writable` and `workspace-input` contracts with their stubs and tests.
`fsReadJsonSyncAdapter` **survives** — the typecheck brokers use it too.

**And prose in other packages asserts `tsc -b`, with tests over the exact strings**: five orchestrator prompt statics,
and — most importantly —
`packages/shared/src/statics/session-snippet/session-snippet-statics.ts:170`, whose sentence *"Ward resolves
cross-package types through each package's `dist/`, so a stale build surfaces as phantom TS2339"* is pinned by a regex
in its own test **and ships into every repo `dungeonmaster init` has touched**. That sentence becomes false.

### K9. Errors found in `packages/ward/CLAUDE.md`

The reviewer checked the doc against source. It is wrong in ten places, independent of this pivot:

| Doc says                                                   | Source says                                                                                              |
|------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| "four subcommands"                                         | five are routed                                                                                          |
| results inspectable via `list`                             | **`list` is not routed at all**                                                                          |
| lint is `npx eslint --format json .`                       | `--fix --stats` are missing from the doc                                                                 |
| typecheck is `npx tsc --noEmit`                            | `--listFiles` is missing                                                                                 |
| unit/integration args                                      | `--forceExit --detectOpenHandles`, `--testTimeout=30000` and the four-extension patterns are all missing |
| e2e is `--reporter=json`                                   | `--reporter=line,json`                                                                                   |
| both jest checks get `--findRelatedTests` when scoped      | unit switches to `--testPathPatterns` for a directory scope; integration rewrites its pattern in place   |
| the broker chain runs through `orchestrate-run-all-broker` | **neither that file nor its layer exists**                                                               |
| the per-package typecheck path is reached only via a cycle | three ways in — a cycle, `eligibleCount === 0`, and any `noEmit: true` package                           |
| `e2eArtifactsPruneBroker` runs at the START of a run       | it runs at the end                                                                                       |

Also `command-run-broker.ts:187` writes `process.exitCode = 1` literally where every neighbour uses
`wardExitCodeStatics.exitCodes.failing` — same value, inconsistent spelling.

---

## Appendix: re-running the probes

Scratch probes live in `<repoRoot>/tmp/`, which is gitignored.

| Script                            | Answers                                                                                                                                                       |
|-----------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `tmp/resolve-probe.cjs`           | What TypeScript and node `require` resolve `@dungeonmaster/*` to                                                                                              |
| `tmp/program-probe2.cjs`          | Whether a package's tsc program pulls shared source or shared `dist/*.d.ts`                                                                                   |
| `tmp/web-program-probe.cjs`       | The same for `web`, which has no references                                                                                                                   |
| `tmp/jest-resolve-probe.cjs`      | What jest's resolver resolves `@dungeonmaster/*` to, per package                                                                                              |
| `tmp/lint-program-probe.cjs`      | What typed lint's program contains, built through the watch host typescript-eslint uses. Takes a package name: `node tmp/lint-program-probe.cjs orchestrator` |
| `tmp/source-condition-probe.cjs`  | What the `source` export condition changes                                                                                                                    |
| `tmp/tsc-source-probe.cjs`        | Whole-repo source typecheck, plain                                                                                                                            |
| `tmp/tsc-incremental-probe.cjs`   | The same, driven by the semantic-diagnostics builder                                                                                                          |
| `tmp/redirect-probe.cjs`          | Whether the project-reference redirect is wired in a given host                                                                                               |
| `tmp/tsc-backend-probe.cjs`       | **The E7 program** — 13 packages from source, zero `dist`, zero errors                                                                                        |
| `tmp/tsc-backend-incremental.cjs` | The same, incremental, for the cold/warm/edit numbers                                                                                                         |
| `tmp/lint-cost-probe.cjs`         | Typed-lint program cost for one tsconfig. Takes a config path and a label                                                                                     |
| `tmp/nm-strategies.py`            | Builds a worktree's `node_modules` by symlink, hardlink or copy (E6)                                                                                          |
| `tmp/program-grouping-probe.cjs`  | Derives how many `--noEmit` programs a repo needs, from compiler options rather than package names                                                            |
| `tmp/tests-included-probe.cjs`    | Confirms the source checking program covers tests, proxies and stubs                                                                                          |

Config and data files those use:

| File                            | What it is                                                                      |
|---------------------------------|---------------------------------------------------------------------------------|
| `tmp/tsconfig.backend.json`     | **The working source-based config** — `paths`, `@types` include, web excluded   |
| `tmp/tsconfig.orch-source.json` | The same shape scoped to `orchestrator`, for the E8 lint comparison             |
| `tmp/tsconfig.source.json`      | The earlier whole-repo attempt, kept because E1 cites it                        |
| `tmp/dm-paths.json`             | The 31-entry `paths` map generated from every `package.json`'s `exports.source` |

Run each with `node tmp/<name>.cjs` from the repo root. The typecheck probes want
`--max-old-space-size=8192`.

**One probe that failed, recorded so it is not repeated.** An earlier `program-probe` used
`ts.createCompilerHost`, which does not implement `getSourceOfProjectReferenceRedirect`. Results from that host say
nothing about what real `tsc` sees. The working version asks the constructed program what is in it rather than asking
the host.
