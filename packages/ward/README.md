# TypeScript Configuration and Ward Checking

**This describes the dungeonmaster monorepo's own TypeScript setup**, not how to use ward in your
project. It is written for someone changing a `tsconfig`, a `package.json` `exports` map, or a build
script in this repo, and for anyone trying to work out why a check resolved the file it did.

How the TypeScript is arranged, why each piece is shaped the way it is, and what breaks when a piece
changes. For ward's CLI — subcommands, flags, check types, file scoping, the summary and `detail`
workflow — see `packages/ward/CLAUDE.md`. This document is about the compiler and resolver setup
underneath those checks.

Every number below names where it came from. Where a claim is reproducible in a few seconds, the
probe that reproduces it is in [Re-measuring any of this](#re-measuring-any-of-this).

---

## 1. The files, and what reads each one

| File | Role |
|---|---|
| `packages/eslint-plugin/configs/tsconfig.json` | The compiler base. Every strict flag lives here — `strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitReturns`, `allowUnreachableCode: false`. Published as `@dungeonmaster/eslint-plugin/tsconfig`, so consumers extend the same base |
| `tsconfig.json` (root) | Extends that base. Adds `noEmit: true`, `moduleResolution: "node"`, `typeRoots`, and the repo-wide `exclude`. Carries no `references`, no `composite`, no `baseUrl`, no `paths` |
| `packages/<pkg>/tsconfig.json` | **The checking config.** Extends the root, re-points `typeRoots` two levels up, and `include`s everything the package wants graded — `src/`, usually `test/` and `bin/`, and root-level `*.ts` |
| `packages/<pkg>/tsconfig.build.json` | **The emitting config.** Extends the package's own checking config and adds `noEmit: false`, `rootDir`, `outDir`, `declaration`, `declarationMap`, `incremental`, `tsBuildInfoFile`, and the exclude list. Every package has one except `web`, which builds with vite instead |
| `jest.config.base.js` (root) | Jest's shared base. Carries `customExportConditions: ['source', 'require', 'default']`, which is what makes a test read a sibling package's TypeScript |
| `packages/<pkg>/jest.config.*` | Per-package jest. Every package's config spreads the root base except `packages/testing/jest.config.js`, which spreads nothing, and `packages/web/jest.config.cjs` merges the condition rather than replacing it |
| `scripts/build-workspaces.mjs` | `npm run build`. Orders the packages, runs each one's own `build` script, and prunes stale emit afterwards |
| `scripts/check-published-output.mjs` | `npm run check:published`. Grades what each `dist/` would ship |

### What runs what

| Command | Config it reads | Emits? |
|---|---|---|
| `npm run ward` (typecheck) | `packages/<pkg>/tsconfig.json` | **No.** `tsc --noEmit --listFiles`, once per package |
| `npm run ward` (lint) | `packages/<pkg>/tsconfig.json`, via typescript-eslint `project: true` | No — but `eslint --fix` writes source, see §7 |
| `npm run ward` (unit / integration) | the package's jest config | No |
| `npm run ward` (e2e) | `packages/web/playwright.config.ts` | Into `.ward/bundle/<hash>/`, never `dist/` — see §6 |
| `npm run build` | `packages/<pkg>/tsconfig.build.json` | **Yes**, to `packages/<pkg>/dist/` |

`project: true` makes type-aware lint resolve each file against the nearest `tsconfig.json`, and ward
derives a package's typecheck discovery count by globbing that same file's `include`/`exclude`
(`tsconfigDiscoverPatternsTransformer`, then `hasCheckDiscoveryMismatchGuard`). So the checking
config's `include` is not decoration: it decides which files lint can grade at all, and it is half of
the number a `DISCOVERY MISMATCH` compares.

---

## 2. Checking and emitting are separate configs

**A quality checker that emits is a build wearing another name.** It writes into every package's
`outDir` and `.tsbuildinfo`, so two runs at once corrupt each other's output, and a consumer gets
their tree compiled by a tool they asked to grade it. `tsc -b` is the only way a check reaches build
mode, so `check-commands-statics.test.ts` asserts — derived over the whole statics object rather than
against a hardcoded list — that no check command carries `-b`.

That invariant is why the split exists. One config cannot serve both jobs, because the two want
opposite file sets:

| | `tsconfig.json` | `tsconfig.build.json` |
|---|---|---|
| `noEmit` | `true` (inherited from root) | `false` |
| Test files, proxies, stubs, harnesses | **included** — lint and typecheck must grade them | **excluded** — they are not the package's public output |
| `tsBuildInfoFile` | absent; nothing is written | `./.ward/build.tsbuildinfo` |
| Run by | ward, and typescript-eslint | `npm run build` |

Every build config carries the same core exclude list:

```json
"exclude": [
  "**/*.test.ts", "**/*.test.tsx", "**/*.proxy.ts", "**/*.stub.ts", "**/*.harness.ts",
  "test/**", "src/.test-tmp/**", "src/_lint-testbed/**"
]
```

A few carry more than the core. `config` names several directories that hold nothing today, and
`testing` adds `dist` and `node_modules`. Neither addition changes what the core does.

### `exclude` prunes discovery, not the program

**`exclude` only removes files from the WILDCARD-discovered set. It never drops a file that a
non-excluded file imports.** The emitted tree proves it: `packages/*/dist` is full of `.proxy.` and
`.stub.` files, while `.test.`, `.integration.` and `.harness.` files appear in no `dist/` at all —
even though one exclude list names all of them together.

Both halves come from one rule. Nothing imports a test file, so `exclude` is the last word on it and
it never reaches `dist`. **Several packages export proxy and stub files as real public API** —
`@dungeonmaster/shared/testing` *is* the proxy barrel, `@dungeonmaster/shared/contracts` re-exports
the stub beside every contract, `@dungeonmaster/orchestrator/testing` is imported by `mcp` and
`server` — so a barrel drags them into the program however the exclude list reads, and they emit.
That is correct: a file a barrel exports must compile into `dist/` or the export resolves to
nothing.

This is also why `check-published-output.mjs` grades in two categories. `.test.` and `.integration.`
files, and anything under a `test/` directory, are **FORBIDDEN** and fail the script. `.proxy.`,
`.stub.` and `.harness.` files are **PUBLISHED ON PURPOSE** and are reported without failing.

### `composite` is absent everywhere, deliberately

Under `composite: true` an imported-but-excluded file is a hard `TS6307` — a composite project must
list every file it compiles. Set against the packages above, no exclude list can be right for both
purposes at once while composite is on. `composite` therefore appears in no build config, and nothing
needs it: `composite` exists to serve project references, and there are no project references (§4).

---

## 3. How a cross-package import resolves

The repo compiles with `moduleResolution: "node"` — node10. **Node10 ignores the `exports` map
entirely.** It resolves a bare specifier by walking `node_modules` upward from the importer, follows
the workspace symlink into `packages/<pkg>/`, and probes the filesystem from there.

Resolved with the TypeScript API from `packages/ward/src/`, on this tree:

| Specifier | Resolves to | Why |
|---|---|---|
| `@dungeonmaster/shared/contracts` | `packages/shared/contracts.ts` | Root-level source barrel, found by probing the subpath. The `exports` map's `require`/`types` keys naming `dist/contracts.js` and `dist/contracts.d.ts` are not consulted |
| `@dungeonmaster/shared/statics`, `/testing`, `/@types`, … | the matching root `*.ts` barrel | Same |
| `@dungeonmaster/orchestrator/testing` | `packages/orchestrator/testing.ts` | Same — a second package-root barrel |
| `@dungeonmaster/testing/register-mock` | `packages/testing/src/register-mock.ts` | `typesVersions` rewrites the subpath, then the rewritten path is probed |
| `@dungeonmaster/testing/brokers/network-record/playwright` | `packages/testing/dist/.../*.d.ts` | Same mechanism, different target |
| `@dungeonmaster/testing` (bare) | `packages/testing/dist/src/index.d.ts` | No `types` field, so `main` decides, and `main` is inside `dist` |
| `@dungeonmaster/orchestrator`, `/config`, `/eslint-plugin` (bare) | each package's `dist/**/*.d.ts` | Same |
| `@dungeonmaster/shared` (bare) | **unresolved** | See below |

Three rules fall out of that table, and all three matter when editing a manifest.

**`typesVersions` IS honoured by node10, and it rewrites a subpath BEFORE any file probing.** So it
outranks everything else about a subpath, including a same-named file sitting at the package root.
`shared` declares none and reaches source by probing; `testing` declares one and goes exactly where it
points, which today is source for `register-mock` and `dist` declarations for its other entries. A
root-level file cannot rescue a subpath that `typesVersions` has already rewritten — it is never a
candidate.

**A bare package name goes wherever `main` points, and every `main` here is inside `dist`.** That is
the whole reason any import in this repo still reads a compiled declaration.

**`packages/shared` has no `"."` export and no `main`, and that shape is intended.** Its `exports` map
holds folder-type subpaths and nothing else, so `require.resolve('@dungeonmaster/shared')` throws
`ERR_PACKAGE_PATH_NOT_EXPORTED`, and so does `require.resolve` of `<pkg>/package.json` for most
packages here. Anything walking an `exports` map has to tolerate a missing `"."` rather than assume
one — the most-imported package in the repo does not have it.

### What still reads `dist`, and what a stale declaration costs

Resolving every `@dungeonmaster/*` import in `packages/**` from its own importing file, over the AST
rather than by text match: the great majority land on source `.ts`, a small minority land on a `dist`
`.d.ts`, and nothing is unresolved. Nearly every `dist` edge comes from a bare specifier —
`@dungeonmaster/orchestrator`, `@dungeonmaster/testing`, `@dungeonmaster/eslint-plugin`,
`@dungeonmaster/config` — and the handful left arrive through `typesVersions` subpaths of
`@dungeonmaster/testing`.

**`tsc` writes `dist/` and never prunes it**, in any mode. There is no tsc-native prune (`tsc -b
--clean` needs `composite`, which nothing has). So a renamed or deleted source leaves its `.js`,
`.d.ts` and `.d.ts.map` behind forever, and along every one of those `dist` edges **a stale
declaration lets typecheck pass against source that no longer exists**. That is the failure
`scripts/build-workspaces.mjs`'s prune step exists to prevent: after each package builds — after
`postbuild`, so cli's esbuild bundle and mcp's statics copy are already in place — it walks that
package's `outDir`, maps each emitted file back through `rootDir` to a stem, and deletes anything
with no source on disk.

The prune predicate is source-existence on disk, and it is deliberately **not**
`ts.parseJsonConfigFileContent(...).fileNames`: by §2, a config-derived expected-set would delete the
proxies and stubs that barrels legitimately export. `PRUNE_DIST=report` prints what a prune would
remove without building or deleting; `PRUNE_DIST=only` prunes without building.

**The prune refuses rather than guesses, and that guard is the reason it is safe to run every build.**
A `rootDir` that does not describe the emit maps every output to a source that cannot exist, so the
whole `dist` reads as stale. Deleting it is not recoverable by a normal build: the buildinfo stays
valid, so the next `tsc` concludes the tree is current and emits nothing to replace what went. A
`rootDir` that genuinely MOVED looks identical by count, and pruning every old path is then correct —
what separates the two is that the build has just written the relocated files, and those map. So the
rule is: when a package has emitted files and the prune would keep NONE of them, it prints the
`rootDir` and `outDir` it used, deletes nothing, and fails the build. Simulating the plausible
`rootDir` mistake against every package's real tree maps **exactly zero files, in every package** —
never one, never two — so zero is the only line the measurements draw, and a percentage rule would
block the legitimate relocation case, which prunes 96%.

An unreadable or unparseable `tsconfig.build.json` fails the same way. `tsc` accepts JSONC; this
prune parses strict JSON, so one `//` comment would otherwise disable pruning for that package
silently and forever.

---

## 4. No `references`, no `baseUrl`

**`references` FORCES resolution through `dist`. It does not enable it.** Measured four ways on
`packages/config`:

| # | `references` | `packages/shared/dist` | Exit | Errors |
|---|---|---|---|---|
| 1 | present | present | 0 | none |
| 2 | deleted | present | 0 | none |
| 3 | deleted | **moved aside** | **0** | **none** |
| 4 | restored | still aside | 2 | **19**, led by three `TS6305`s naming `packages/shared/dist/statics.d.ts` |

Row 3 is the load-bearing one: with no `references` and no `shared/dist` at all, the typecheck is
clean, because node10 falls through the workspace symlink to the root barrel source. Row 4 inverts the
intuition. `--listFiles` over the same program counts 615 `.d.ts` and 0 source files from
`shared`/`testing` **with** references, and 813 source `.ts` files **without**.

Nothing consumes a `references` array here anyway. Only `tsc -b` follows one; ward's typecheck is a
bare per-package `tsc --noEmit`, and each package's `build` script is a bare `tsc -p
tsconfig.build.json`. Build ORDER comes from `scripts/build-workspaces.mjs`, which derives a
topological order from each `package.json`'s `@dungeonmaster/*` dependencies on every run, alphabetical
within a tier. A hardcoded list would silently skip a package added later.

Per-package `tsc --noEmit` covers the repo with no discovery gaps. The most recent full ward run on
disk, `run-1788795119488-53e6`, reports **`filesCount` equal to `discoveredCount` in every package,
and lint, typecheck, unit, integration and e2e all passing** — no package typechecks fewer files than
its own `include` discovers, so nothing falls between the per-package programs.

### `baseUrl` must stay out of the root config

`packages/eslint-plugin/tsconfig.json` declares `"paths": {"@dungeonmaster/eslint-plugin":
["./src/index.ts"]}` and no local `baseUrl`. TypeScript anchors `paths` to `baseUrl` whenever one is
set, so a root `baseUrl: "."` inherited through `extends` re-anchors those paths to the repo root,
`<repoRoot>/src/index.ts` does not exist, and resolution falls back to `node_modules` — dragging that
package's own `dist/**/*.d.ts` into its program. Ward's stored results, same command nine minutes
apart with the package untouched:

| Run | `filesCount` | `discoveredCount` |
|---|---|---|
| `run-1788750076191-e7af` | 593 | 593 |
| `run-1788750628645-275b` | **616** | 593 |

With no `paths` at root, `baseUrl` anchors nothing, so its only reachable effect is breaking the one
`paths` map this repo has. If some later change genuinely needs it, the compensating fix is one line:
give `packages/eslint-plugin/tsconfig.json` its own `"baseUrl": "."`.

---

## 5. The `source` export condition

Most packages carry an `exports` map, and nearly every subpath in one advertises a `source` condition
pointing at TypeScript. A few subpaths are bare strings naming a built file instead. `hooks`,
`server`, `ward` and `web` declare no `exports` map at all, so conditions never enter their
resolution.

Jest is the only thing in the check pipeline that reads the condition, and tsc is the one that
cannot.

| Consumer | Honours `source`? | Mechanism |
|---|---|---|
| jest | **Yes** | `customExportConditions` in the jest config |
| ward's jest child process itself | **Yes**, conditionally | `NODE_OPTIONS=--conditions=source`, injected by the unit and integration brokers |
| tsc | **No** | See below |
| eslint | No | Its own rule modules resolve through plain Node |
| Playwright, vite config loader, plain `node` | No | Plain Node CJS, no condition |

**The `source` condition does nothing for tsc under node10.** Node10 ignores `exports`, so the key is
never read. Nor can the flag simply be added: TypeScript accepts `customConditions` only under
`moduleResolution` `node16`, `nodenext` or `bundler`, and rejects it otherwise with

```
TS5098: Option 'customConditions' can only be used when 'moduleResolution'
        is set to 'node16', 'nodenext', or 'bundler'.
```

So **ward's typecheck cannot be given the source condition without changing module resolution
repo-wide** — which is a different and much larger change than a flag. Under `bundler` or `nodenext`
with `customConditions: ['source']`, `@dungeonmaster/testing` does resolve to
`packages/testing/src/index.ts`; that is the shape of the alternative, not a drop-in.

### Three homes for the jest condition, and a probe before ward injects it

`jest.config.base.js` carries `customExportConditions: ['source', 'require', 'default']` and reaches
every package whose jest config spreads it. `packages/testing/jest.config.js` spreads nothing, so it
carries its own copy and the two have to be kept in step by hand. `packages/web/jest.config.cjs`
merges rather than replaces: `['source', '', 'require', 'default']` — the empty string is MSW's jsdom workaround and must
stay in the list.

`customExportConditions` governs only what the TEST environment resolves. The transform glue's own
`@dungeonmaster/shared` imports are resolved by Node, outside that environment, so without help the
jest process reads `dist/` while the tests it runs read source. `checkRunUnitBroker` and
`checkRunIntegrationBroker` therefore spawn jest with `NODE_OPTIONS=--conditions=source`.
`checkRunTypecheckBroker`, `checkRunLintBroker` and `checkRunE2eBroker` set no environment at all.

That injection is guarded, because **Node does not fall through when a matched condition names a
missing file** — it throws `MODULE_NOT_FOUND` naming the `.ts` path:

```
plain                 -> { from: 'dist' }
--conditions=source   -> Cannot find module '…/statics.ts'   MODULE_NOT_FOUND, exit 1
```

Several non-private packages declare a `source` condition naming a file their `files` field never
packs — cli, config, eslint-plugin, mcp, orchestrator, shared and tooling among them — and ward is
published and runs in other people's repos. So `sourceConditionSupportedBroker` walks ancestor
directories for `node_modules/@dungeonmaster/shared/statics.ts`, present here through the workspace
symlink and absent in an install, and the flag is injected only where it can work. The guarantee is
behavioural rather than declarative: the manifests keep advertising `source` targets they do not ship.
Packing the barrels instead is rejected, because they `export *` from `src/**` — honouring the
condition declaratively means shipping those packages' whole TypeScript trees. `@dungeonmaster/testing`
is the one package that does pack every file its `source` keys name, and it does so for an unrelated
reason: its published `ts-jest` glue reads `../src/…` at runtime.

### The variable is inherited, and is stripped before any grandchild sees it

`NODE_OPTIONS` reaches every descendant process. A test that spawns a compiled child — a built hook
binary, the bundled CLI — would hand that child source resolution, and it would die resolving a `.ts`
file it cannot parse. `packages/testing/src/jest.setup.js` removes `--conditions=source` from
`process.env.NODE_OPTIONS` at setup time for exactly that reason.

Deleting it there does not weaken the jest process: Node parses `NODE_OPTIONS` once at startup, so the
condition stays applied to every resolution the worker makes afterwards, and jest forks its workers
from the untouched main-process environment. It only stops the value being copied outward.
`packages/cli`'s `cli-bin.harness.ts` additionally sets `NODE_OPTIONS: ''` on its own spawn, so that
one measures what a consumer requiring the shipped esbuild bundle gets.

### Lint is not a member of the "reads source" list, in one narrow way

The files ESLint CHECKS resolve like every other check. What reads `dist` is one import inside this
repo's own rules: `eslint.config.js` loads them from TypeScript source via `ts-node/register`, but they
`import { locationsStatics } from '@dungeonmaster/shared/statics'` at module load, and ESLint sets no
`source` condition. Rebuild `shared` before lint only when a statics value a custom rule reads has
changed.

---

## 6. What `dist` is for

No package ward CHECKS needs it. `npm run prod`, `dungeonmaster start` in a consumer, the MCP stdio
child, `npm run init`, the hook binaries and `npm run build` itself all do — and so does ward's own
package, because `npm run ward` invokes the compiled `dist/bin/ward-entry.js` this package's `bin`
field names, so an edit to ward's source is invisible until
`npm run build --workspace=@dungeonmaster/ward` runs.

**`build:clean` removes two things, not one.** Every build config points `tsBuildInfoFile` at
`./.ward/build.tsbuildinfo` — beside `dist`, not inside it — so `rm -rf dist` alone leaves the
incremental cache, and the next `tsc` reads the cache, concludes the tree is current and **emits
nothing at all: an empty `dist` at exit 0**. The script is
`rm -rf packages/*/dist packages/*/.ward/build.tsbuildinfo && npm run build`, and the prune walk in
`build-workspaces.mjs` refuses any `outDir` that is not a strict subdirectory of the package, which is
what keeps the buildinfo out of its reach.

**`npm run check:published` requires `build:clean`, not `build`.** It reads compiled output, and
against a warm tree it grades files no current build config would emit — anything an exclude list
started dropping is still sitting there from the build before. Only a cold tree answers the question
it asks.

**A `files` field is not optional for a non-private package.** The repo-root `.npmignore` is `*` plus
a handful of `!` re-includes (`src/`, `bin/`, `package.json`, `README.md`, `LICENSE`), and it applies
to workspace packs. An explicit `files` field is what overrides it. Without one a package packs its
`main` and its manifest and nothing else — which for a package whose consumers require a subpath is a
`MODULE_NOT_FOUND` at their first run. `@dungeonmaster/testing`'s field is
`["dist","src","!src/**/*.test.ts","ts-jest","jest-config-base.js"]` and it must stay that wide: its
published `ts-jest` glue requires `../src/…` by relative path at runtime, so a bare `["dist"]` kills
every consumer's jest at transform time.

**One ward check does build, and it never touches `dist`.** `bundleBuildBroker` runs the package's own
`npm run build -- --outDir <path>` for an e2e run, into `<pkg>/.ward/bundle/<sha-256 of the inputs>/`.
A build goes to `.tmp-<pid>` and is `rename`d onto its hash; `rename` onto a non-empty directory is
refused by the kernel, so a run that loses the race discards its own copy and serves the winner's,
which — same inputs — is the same bundle. Nothing is ever written into a published hash directory.

---

## 7. Traps

**A worktree under `worktrees/` is not hermetic.** Its `node_modules/@dungeonmaster/*` are relative
symlinks into its own `packages/`, so while everything it needs is present, resolution stays inside it.
Take one thing away and node10's walk-up carries on into the parent — which is the main checkout.
Resolving from `worktrees/<name>/packages/config/src/`, with the worktree's own `dist` made
unavailable to the resolution host:

| Specifier | Resolves to |
|---|---|
| `@dungeonmaster/shared/statics` | the worktree's `packages/shared/statics.ts` — source is present, so it stays |
| `@dungeonmaster/testing` | **the main checkout's** `packages/testing/dist/src/index.d.ts` |
| `@dungeonmaster/orchestrator` | **the main checkout's** `packages/orchestrator/dist/src/index.d.ts` |

So a resolution experiment run inside a worktree can pass when it should fail, having silently graded
the main checkout. Confirm which tree answered before believing the result.

**Ward's own `eslint --fix` can break compiling code.** `@typescript-eslint/no-unnecessary-type-assertion`'s
autofix mishandles a chained `X as unknown as Y`: it strips the outer cast and leaves a bare
`as unknown`, turning type-correct code into code that does not compile. It is intermittent — a later
deliberate before/after check of `git status --porcelain` across four packages found the tree
byte-identical — which is worse to diagnose, not better. **If a ward run reports typecheck failures in
files nobody edited, `git diff` them before concluding anything.** The repair is usually deleting a
cast that was never needed, not re-adding one.

**A ward run killed at the e2e stage is not a green run with a missing tail.** It is a run whose
slowest and least-covered check never reported. E2e was red on `master` for four days behind exactly
that reading.

**A `peerDependency` on an unpublished workspace sibling makes the package uninstallable.** npm 7+
auto-installs peers, so the install E404s and writes no `node_modules` at all. Workspace siblings go in
`dependencies`.

**Concurrent ward runs produce transient reds**, and a build in flight breaks every other agent's
ward — seven ward integration tests failed on `TS2307: Cannot find module '@dungeonmaster/testing'`
because `packages/testing/dist` did not exist for a few seconds. Re-run before diagnosing, and let one
process own the build.

---

## 8. Adding or changing a package

`packages/CLAUDE.md` has the full checklist. The parts this document is responsible for:

1. **Both tsconfigs.** `tsconfig.json` extending `../../tsconfig.json` with `typeRoots` and an
   `include` covering every file lint and typecheck should grade. `tsconfig.build.json` extending
   `./tsconfig.json` with the emit settings, the standard exclude list, and
   `tsBuildInfoFile: "./.ward/build.tsbuildinfo"`. Neither substitutes for the other.
2. **No `composite`, no `references`, no `baseUrl`.**
3. **A `files` field**, if the package is not `private`.
4. **A `source` condition on each `exports` subpath**, if the package is imported by another
   package's tests — and it stays behavioural, so nothing needs to pack the file it names.
5. **A jest config** that either spreads `jest.config.base.js` or carries its own
   `customExportConditions`.

---

## Re-measuring any of this

`ts.resolveModuleName` answers the resolution questions exactly, in a second, without invoking the
compiler:

```bash
node -e "
const ts=require('typescript');
const host={fileExists:ts.sys.fileExists,readFile:ts.sys.readFile,realpath:ts.sys.realpath,
             directoryExists:ts.sys.directoryExists,getDirectories:ts.sys.getDirectories};
const opts={moduleResolution:ts.ModuleResolutionKind.Node10,module:ts.ModuleKind.CommonJS,
            target:ts.ScriptTarget.ES2022};
const from=process.cwd()+'/packages/ward/src/x.ts';
for (const s of ['@dungeonmaster/shared/contracts','@dungeonmaster/testing']) {
  const r=ts.resolveModuleName(s,from,opts,host);
  console.log(s, '->', (r.resolvedModule||{}).resolvedFileName ?? 'UNRESOLVED');
}"
```

Point `from` inside a worktree to reproduce the walk-up escape; swap `Node10` for `Bundler` and add
`customConditions:['source']` to see what changing module resolution would buy.

For the rest: the per-package typecheck numbers, `filesCount` and `discoveredCount` are in
`.ward/run-<id>.json` for every run ward has stored. `PRUNE_DIST=report node scripts/build-workspaces.mjs`
lists stale emit without touching anything. `npm run check:published` grades the published trees, on a
tree built by `npm run build:clean`.
