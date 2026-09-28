# Scripting opportunities: what of the remaining work a script can do

Written 2026-09-28 by a read-only planner, against the working tree of `gateway-pivot` while a10-fs,
a14-fs, a17-get, f52 and f47 were still editing. Every count below is from that one read, and it goes
stale as agents land.

## Short answer

A good share of what is left can be scripted, but only four pieces are worth building, and they pay off
more in the consumer repo than here.

1. **A census tool.** Agents and planners work out the same facts again for every chunk: who imports an
   adapter, which proxies compose that caller's proxy, and which catch-all staging methods callers lean
   on. A scanner that uses the type checker already exists as a one-off (`tmp/adapters-fresh/scan.cjs`,
   gitignored). Promote it into a shipped command.
2. **A codemod that inlines pass-through adapters.** About 53 of the 121 remaining adapter files are one
   outside call plus a parse, and a gateway export already does the same job. Their callers swap an
   import and a call shape, and their proxies swap one staging method for another through a lookup table.
   The codemod can do the caller and the proxy edits. It cannot do the roughly one in four proxy
   consumers that stage through a catch-all or read back through an aggregate method, and it cannot
   find a test that passed only because of a catch-all. Those stay with agents.
3. **An autofix that rewrites B03's stub and proxy imports.** 1,931 import statements in 1,679 files
   bring `*Stub`/`*Proxy` names in through a workspace barrel (1,714 of them through
   `@dungeonmaster/shared/contracts`). Each one maps to exactly one per-file path. This is the biggest
   single mechanical job left in the epic, and it is a lint fixer, not agent work.
4. **A way to scan a rule that is off, and to block new violations of it.** `ward` gets a command that
   runs one off rule and splits its violations into 2–4-file batches. The pre-edit hook blocks new
   violations of every `pre-edit` rule, even while that rule is off.

The brand work (B12, B13, B15) was already designed as autofixes. The other open items are judgement:
B02's deletion list, B11's merges, B14's shapes, B16, T04, T06, T08, most of T05, and every adapter with
logic in it. Scripting will not shrink those.

## How the recent chunks split into mechanical and judgement work

| Commit | What agents changed | Mechanical | Judgement |
|---|---|---|---|
| 8e5e7f3ec path/dirname, path/join (38 files) | `pathJoinAdapter({ paths: [a, b] })` → `join(a, b)`; import swap; proxy lines `pathJoinAdapterProxy();` deleted | nearly all of it | a `filePathContract.parse(...)` added wherever the gateway's plain `string` return lost a brand the caller's type needed |
| e43c1c424 ward read-file (20 files) | `fsReadFileAdapter({ filePath })` → `readFile(path)`; proxy `returns({ filePath, content })` → `readFileProxy().returns({ path, contents })`; a hand-made `throws({ error: ENOENT })` → `.missing({ path })`, EACCES → `.denied({ path })` | the caller swaps and a one-to-one table of staging methods | the hash-files adapter became a broker |
| e5d4ca0ae siegelense readdir (23 files) | `resolves({ dirPath, entries })` → `returns({ path, names })`; `fsReaddirAdapter(...)` → `(await readdirIfExists(p)) ?? []` | the swaps and the `?? []` | exact staging broke 3 cleanup-run tests that had passed on the old catch-all; each needed a new `setupDir` staging |
| 16097fbe1 siegelense open-fd, readlink, realpath, rename (27 files) | the same shape | mostly | fd branding at the call site |
| 235a64368 rule-tester (76 rule tests + local-eslint) | two lines per test file | all of it, done with a python script | the harness's own home (concession 8) |
| e1076c324 web post (35 files) | `fetchPostAdapter` → `fetchJson` plus a new result contract, stub and test per broker | contract/stub/test scaffolding follows a template | the result shape of each contract |
| 596bbd1e3 orchestrator git (42 files, −1,655 lines) | the riftcarver and prepare proxies were rewritten (216- and 203-line diffs) | little | proxy staging redesigned around `runProxy` |

What these chunks show: when the gateway wrapper does exactly what the adapter did, the whole chunk is
mechanical apart from the catch-all fallout. When the adapter held logic, or its proxy staged something
the gateway proxy says differently, the chunk is mostly design work.

## Opportunity 1: a census and batching tool

**Why it pays.** Execution step 2 of EPIC.md's "Converting the next repo" has planner agents hand-write
a census for every package: every outside import, every adapter, every `jest.mock` and `as never`, and
which proxies compose which (the O10 lesson, where 41% of an 82-minute run went on a proxy that composed
a removed catch-all). Here that census was built three times: `tmp/adapters-fresh/`, A12's "Phase 2
census", and `triage-phase2.md`. Every agent's first step (brief step 3, "check Current state against the
code") re-derives the same facts.

**What it reports, per adapter:**
- its shape: one outside call with nothing added, or it adds something. `tmp/adapters-fresh/adapters.py`
  already decides this from `facts.json` through the type checker.
- its callers, split into production, proxy and test files. A plain text scan gets this wrong: I first
  matched on the file stem, and three packages' `fs/read-file` callers merged into "45 callers". The
  tool has to resolve imports.
- every proxy that composes a caller's proxy, followed transitively. This is the set that has to go to
  the same agent.
- the proxy methods whose body stages `calledWith([])`, `onceFor([])` or `() => true`, or reads back
  through `callsMatching([])`, and which callers call them.
- the gateway export that matches, where one exists, found through the one outside call the adapter
  makes.
- output: batches of 2–6 files in dependency order, in the table form EPIC.md's status tables use.

**Measured today with a rough version of this scan:** 24 of the remaining adapter proxies define a
catch-all or aggregate method. 36 of the 153 files that import any adapter proxy call one of those
methods. Those 36 files are the whole of the judgement pile in the codemod below, and the census names
them before anyone is dispatched.

**Risk:** low. The tool only reads code; it never edits anything.

**Where it should live:** the published `@dungeonmaster/tooling` package, which already ships a bin
(`detect-duplicate-primitives`). Make it a `census` bin there, or a `dungeonmaster census` subcommand.
Either way the consumer gets it through `init`. Do not ship it as an MCP tool: its output is a planning
artifact, and a JSON file the operator can diff between runs is worth more.

## Opportunity 2: inline pass-through adapters

**Coverage.** I read each of the 121 remaining `*-adapter.ts` files (hydration-recipes 1,
orchestrator 17, siegelense 39, testing 28, web 36):

| Package | Pass-through, gateway equivalent exists | Has logic: broker, transformer or split |
|---|---|---|
| hydration-recipes | 1 (`dm-jsonl/append` → `appendLinesCreatingParent`) | 0 |
| orchestrator | 10 (append-file, rename, symlink, write-file, readdir, read-file, readlink, is-accessible, set-timeout, check-port-free → `isPortFree`) | 7 (spawn-stream-json, watch-tail, read-jsonl, set-interval, signal, check-alive, readline) |
| siegelense | 12 (delay, is-native-error, close-fd, read-file, rm, symlink, unlink, write-file, tmpdir, stat → `statIfExists`, statfs → `diskFreeBytes`, crypto-hash) | 27 (13 playwright/session, spawn-detached, 2 cli-package, 2 fetch, 2 net unix, 2 npm, os-info, pixelmatch, pngjs, 2 process) |
| testing | 13 (exec-sync, random-bytes, is-native-error, fs exists/read-file/readdir, path dirname/join, 3 msw, test-info-attach, the dead mantine-render) | 15 (5 jest/*, 7 typescript/*, child-process mocker, timers watch, page-events) |
| web | 17 (3 fetch → `fetchJson`, 3 mantine, 6 rxjs, 4 testing-library, react-dom mount) | 19 (5 dom composer, 2 canvas, 3 indexed-db, 4 xyflow, elk, file-read, websocket, xhr, post-with-status) |
| **Total** | **53** | **68** |

The in-flight agents already hold orchestrator `fs/*`, testing `fs/*` and `path/*`, and web `fetch/get`.

Most of the caller files sit in the pass-through column. Siegelense's pass-throughs alone account for
about 190 production and proxy files: `read-file` 31+30, `is-native-error` 20+20, `write-file` 12+11,
`stat` 10+9, `unlink` 8+7. In web, the four testing-library adapters and `mantineRenderAdapter` make
2,060 call sites across about 150 test files (1,458 of them `mantineRenderAdapter(`). That web sweep is
the same shape as the rule-tester sweep, which a python script already did.

About 13 of the logic adapters are pure logic with no outside call left: the typescript/* AST walkers,
and the playwright/session layers that build `page.evaluate` source. They only move folders and get
renamed into `transformers/` or `statics/`. A second, simpler script mode can do the move, the rename and
the import rewrite, as A06's G-J did for the typed-* adapters.

**What the script does for one adapter:**
1. Rewrite each caller's call by AST: object parameters become the gateway's positional arguments
   (`errorIsNativeErrorAdapter({ value: x })` → `isNativeError(x)`), and the import moves to the barrel
   (`#gateway/node/fs__promises`, never the wrapper's own file; see G-O).
2. Rewrite each proxy's import to the gateway proxy's own file, and map each staging method through a
   table: `resolves/returns({ filePath, content })` → `returns({ path, contents })`,
   `resolves({ dirPath, entries })` → `returns({ path, names })`, ENOENT/EACCES `throws` →
   `missing`/`denied`, `getWrittenFor` → `writtenContentsFor`. For the consumer, build the table from
   what each proxy method's body does (`calledWith([x]).resolves(v)` → the gateway's `returns`), not
   from method names, so it works on adapters it has never seen.
3. Delete the adapter folder and its `adapters.ts` barrel lines once no caller is left.
4. Print a "left for an agent" list: every catch-all method call, every call that loses a brand, every
   return shape that changes.

**Where a script goes wrong, with the evidence:**
- **Catch-all staging.** `resolvesNext`/`rejectsNext` on orchestrator `fs/read-file`, `resolvesAny` on
  siegelense `fs/read-file`, `defaultsToNotFound`/`defaultsToFound` on `fs/is-accessible` (7 of 13 users
  call them), and aggregate read-backs such as `getAllWrittenFiles` (6 of 11) and `getDeletedPaths`
  (5 of 7). No gateway method matches these one-to-one.
- **Tests that passed only on a catch-all.** You only find these by running the tests (e5d4ca0ae: 3
  tests). The script can list which tests to expect trouble in (every test whose proxy used a catch-all),
  but a person has to write the new staging.
- **Return shapes change.** `[]` becomes `null`, so the call gets `?? []` (e5d4ca0ae). A branded return
  becomes a plain `string`, so the call gets `contract.parse` (8e5e7f3ec). `AdapterResult` returns go
  away. `stat` becomes `statIfExists`, and `{ sizeBytes, modifiedAtMs }` has to be rebuilt.
- **Wrapped errors.** Siegelense's `fsReadFileAdapter` rethrows as `Failed to read file at …` with the
  real error on `cause`. 16 of its 60 caller files read `.cause`. Of the 42 production call sites, 25 are
  plain calls and 17 have a `.catch`. 12 of those 17 are the same idiom: ENOENT on `cause` → `return null`
  (10 sites) or → a thrown custom error (2). A pattern rule can rewrite that idiom to `readFileIfExists`.
  The other 5 need someone to read them.
- **Raw mocks sitting beside the adapter proxy.** For example `registerMock({ fn: join }).calledWith([])`
  in `orphan-read-broker.proxy.ts`. The script leaves these alone, and the census flags them.

**Risk:** medium. Every file the script touches still needs a scoped ward run. The brief's "prove your
tests bite" rule currently means a mutation per migrated line. For a pure import swap whose staging was
already exact, a sampled mutation is enough, but only the user can relax that rule.

**Where it should live:** in `@dungeonmaster/tooling` beside the census, as `migrate-adapter <path>`,
with a dry run and a mapping file. It should not be an eslint autofix, because one migration edits the
caller, the proxy, the tests and the deletion together, and an eslint fixer edits one file.

## Opportunity 3: B03's per-file stub and proxy imports

Of the 1,931 barrel import statements, 91 are from `@dungeonmaster/testing`, whose test support ships
publicly and stays as it is. About 1,840 have to move. Each `XStub` or `xProxy` name is declared in
exactly one file inside the package its barrel belongs to, so the new specifier can be computed:
`@dungeonmaster/shared/contracts/quest/quest.stub`. An earlier codemod of the same kind,
`tmp/restructure/caller_rewrite.py`, already rewrote every gateway import for the restructure.

- **As an autofix** on the rule B03 extends (`enforce-import-dependencies`, or its own rule): the fix
  is one file at a time, finds the declaring file through the type checker, and splits one import
  statement into several. It ships to the consumer inside the eslint plugin, and ward's lint `--fix`
  applies it. **This is the right home.**
- **As a one-shot script:** each package's `package.json` `exports` becomes the three-key form (about
  16 packages; the `dist` layout differs per package, per B03 step 1), the barrels move to
  `src/<folderType>/<folderType>.ts`, and stub and proxy lines leave the production barrels. The
  consumer's packages have the same shape because `create-package` made them, so the script belongs in
  `tooling` too. The `create-package` templates must emit the new form, or every new package regresses.

**Judgement stays with an agent for:** the sanctioned home for caller-facing proxies (F18, and
`start-orchestrator.proxy.ts`), and the rule change.

**Risk:** low once the autofix's tests pass. A wrong specifier fails typecheck right away.

## Opportunity 4: scanning an off rule, and blocking new violations

Every rule item runs a scan of a rule that is still off, before anyone fixes anything: B06 ("0 of 1125"),
B17-1, T04 (57), T05 (476), and A18/A19 next. Each one is a hand-written config (`tmp/*-measure.config.js`
and `run-*-measure.mjs`). EPIC.md step 7 has the consumer do this once per rule.

- `npm run ward -- scan <rule>`: runs one rule at error over the repo, whatever the config says, and
  prints its violations grouped per package in 2–4-file batches. Ward ships to consumers.
- **Block new violations in the pre-edit hook.** The hook only blocks newly introduced violations
  (`violations-analyze-broker`), but `eslint-config-filter-transformer` keeps the host config's severity.
  So a rule tagged `pre-edit` and registered `off` (`ban-proxy-catch-all-defaults`,
  `ban-invented-failures`) never fires while agents are mid-migration. If the hook ran every `pre-edit`
  rule at error for new violations only, the operator's handoff scan list would enforce itself.
- The same goes for the handoff's banned-diff list (`as never`, `as unknown as`, `onceFor([])`, raw
  `'fs'` imports, real `process.cwd()` in tests). Add whatever is still missing from that list as
  `pre-edit` rules, and the ratchet covers it. A separate `git diff` grep script would be a weaker copy.

**Risk:** the ratchet can block an agent on a shape it cannot fix yet, such as a proxy whose gateway
counterpart has no read-back. That needs the same escape hatch the brief gives today: stop and report.
The user decides whether to turn the ratchet on.

## Phases 3 to 6, item by item

| Item | Shape | Script, autofix, or judgement |
|---|---|---|
| A18 | a scan, then small fixes | Opportunity 4's scan; the easy fixes go through Opportunity 2's codemod; the rest need judgement |
| A19 | configuration flips | one agent; nothing to script |
| B02 | parse index plus deletions | the index is tooling an agent builds; deleting a confirmed-dead contract (contract, stub, test and barrel line) is scriptable, but someone must check the list first (B06 found two it had wrong) |
| B03 | exports plus import rewrite | **codemod and autofix** (Opportunity 3) |
| B10 | owner index | an agent builds tooling |
| B11 | 37 duplicated names | judgement (which check is right, and which package it moves to); after a merge, the import rewrite reuses Opportunity 3's fixer |
| B12 | rule **with autofix** by design | the autofix does it. Refusals of `z.unknown()` have no autofix (128 uses in 85 files as of 2026-09-26) |
| B13 | 4 of 5 checks autofix | autofix; `ban-join-id-beside-child` has no autofix, by design |
| B14 | about 244 shape fixes | judgement (each needs a new contract) |
| B15 | runs the B12/B13 autofixes package by package | mostly autofix. Two scriptable extras: a pass that removes each stub-field `as never` only where typecheck stays green (the source doc counted about 1,000), and TypeScript language-service renames when a brand's derived text renames its type (`FailCount` → `WorkItemRetryCount`) |
| B16 | two rules plus fixes | judgement |
| T04 | 57 violations | judgement (compose real proxies) |
| T05 | 476 violations: 251 empty `calledWith`, 223 invented errors, 2 catch-alls | Partly autofixable: a hand-made error that carries a Node `code` (for example `Object.assign(new Error(..), { code: 'ENOENT' })`), staged on a gateway fs proxy, becomes that proxy's recorded-failure method or stub. That covers roughly the code-bearing third. The code-less errors and the empty `calledWith` need someone to decide what the real argument or error is |
| T06, T10 | rule changes | one agent each; T10 should scan to zero |
| T08 | read catch-everything code | judgement, as the item says |
| T09 | generated catalog | a generator script by design |

## What stays with agents

- Adapters with logic: 68 of the 121. They get a broker or transformer, and often a redesigned proxy
  (the git proxies in 596bbd1e3 are the example).
- Every proxy the census flags as using a catch-all or aggregate method, and every test that loses its
  catch-all.
- Result contracts for the web fetch moves (e1076c324): a template can create the files, but someone
  has to decide the shape.
- Gateway gaps: when a gateway proxy cannot say what a caller needs, the agent stops and the gateway
  grows the method (F43 to F57).
- The mutation proofs, the scoped ward runs, and the decisions about B02, B11, B14, B16, T04, T05's
  remainder, and T08.

## What carries to the consumer repo

| Tool | Home | Carries? |
|---|---|---|
| census and batching | `@dungeonmaster/tooling` bin | yes; it replaces execution step 2's hand-written census |
| inline pass-through adapters (table built from each proxy method's body) | `@dungeonmaster/tooling` bin | yes. The consumer's adapters follow the same folder conventions, so they very likely wrap the same builtins the same way. A method table keyed on names used here would not carry |
| B03 import autofix | eslint-plugin | yes, with no extra work |
| B03 exports/barrel script, plus `create-package` templates | `@dungeonmaster/tooling`, cli templates | yes |
| `ward scan <rule>` | ward | yes; it drives execution step 7 |
| pre-edit ratchet for off `pre-edit` rules | hooks | yes, through `init` |
| B12/B13 autofixes, the `as never` remover | eslint-plugin, tooling | yes |
| web testing-library/mantine sweep, siegelense ENOENT-on-`cause` idiom | `tmp/` one-offs | no, this repo only; the generic inliner covers the consumer's versions |

I do not know the consumer repo's size or which adapters it has. The census is the first thing to run
there, and it will say how much of the codemod applies.

## Recommended order

1. **Census tool** (promote `tmp/adapters-fresh/scan.cjs`, and add the proxy-composition graph and the
   catch-all report). Use it at once to plan what is left of A13, A14 and A17.
2. **`ward scan <rule>` and the pre-edit ratchet.** They are small, and every later item uses them.
3. **Adapter inliner.** Prove it on siegelense `error/is-native-error` first (20+20 files, and its proxy
   stages nothing), then on the 25 plain siegelense `read-file` sites, then the web testing-library and
   mantine sweep. Compare each run's diff with what an agent would have written before trusting the next.
4. **B03 autofix and exports script**, run after B02 as the order requires. This is the largest mechanical
   saving.
5. **B12/B13 autofixes as planned**, plus the typecheck-driven `as never` remover and brand renames for B15.
6. **T05's autofix for invented errors that carry a code**, then agents sweep the rest.

Build 1 and 2 even if nothing else gets built. They cut how many turns every agent spends working out
the same facts, in this repo and in the consumer.
