# Gateway build: follow-ups for the migration/consumption phase

Each entry names a decision made while building a gateway module and the existing callers whose
behavior it changes, so the migration phase reviews them rather than assuming a straight swap.

## Gateway shape lint rules (gateway-import-boundary, gateway-colocation, gateway-layout)

Built as new rules in `packages/eslint-plugin/src/brokers/rule/{gateway-import-boundary,gateway-colocation,gateway-layout}`,
registered in the plugin's rule index only (`eslint-plugin-create-responder.ts`/`.proxy.ts`), never
wired into `dungeonmasterCustomRules` or `dungeonmasterRuleEnforceOnStatics`. Measured with a scratch
config (`tmp/gateway-shape-measure.config.js` + `tmp/run-gateway-shape-measure.mjs`) over
`packages/{npm,node,browser,bin}/src`: 133 real violations, none of them fixed here.

**RESOLVED** — `ruleGatewayImportBoundaryBroker` now special-cases `@<scope>/testing` (and its
subpaths): allowed only from `.proxy.ts`, `.test.ts`, `.integration.test.ts` and `.stub.ts` files
(`gatewayTestSupportSuffixStatics.suffixes`), still banned from every runtime file (`index.ts`,
plain wrappers). RuleTester cases added for both sides in
`rule-gateway-import-boundary-broker.test.ts`.

### `@dungeonmaster/testing/register-mock` inside a gateway proxy — needs a decision

`gateway-import-boundary` flags EVERY gateway `.proxy.ts` that imports `registerMock` (or
`requireActual`) from `@dungeonmaster/testing/register-mock` — roughly 60 files across all four
packages (every fs, child_process, fetch, WebSocket, localStorage, indexedDB, net and bin proxy).
The brief's rule 1 reads literally ("never another workspace package of ours"), and
`@dungeonmaster/testing` is a workspace package. But `scrolls/adapters-to-one-place.md`'s own
"Tests" section says the gateway gets its own Jest config specifically so `registerMock` proxies
work there "as they do for adapters today" — implying `@dungeonmaster/testing` is meant to be
reachable from a gateway proxy, the same way `isNpmPackageGuard` already special-cases
`@dungeonmaster/shared/adapters` as a mockable I/O boundary. Left un-special-cased here because the
brief's rule 1 names no exception and instructed reporting real findings rather than guessing at
one; the lint phase should decide whether `gateway-import-boundary` gets a
`@dungeonmaster/testing`-shaped carve-out (test-only files, e.g. `.proxy.ts`/`.test.ts`, not
implementation) or whether gateway proxies need a different mocking mechanism entirely.

**RESOLVED** — took direction (a): `rule-gateway-colocation-broker`'s purity check now accepts a
`VariableDeclarator` initialized from a bare `globalThis.x` member expression OR destructured
directly off `globalThis` (`export const { x } = globalThis;`, the shape every existing global
pass-through already uses), gated to `kind === 'const'`, one declarator, no call, no function body.
`packages/node/src/console/index.ts`'s existing `export const { console } = globalThis;` now passes
as a genuine RuleTester `valid` case instead of the placeholder `invalid` case that stood in for it.
`packages/node/src/module/index.ts` (this section's other named failure, non-systematic) is fixed
separately below its own heading: it is now a curated subpath of named re-exports, not a built
object, so it needs no exception from this rule at all.

### Global pass-throughs cannot satisfy `gateway-colocation`'s literal purity list

Every browser/Node GLOBAL pass-through index.ts (`console`, `atob`, `clearInterval`, `clearTimeout`,
`crypto`, `document`, `location`, `navigator`, `requestAnimationFrame`, `sessionStorage`, `window`,
`AbortController`, `Blob`, `FileReader`, `ResizeObserver`, `URL`, `XMLHttpRequest`,
`createImageBitmap`, and node's `process`, `setInterval`, `setTimeout`) fails purity: a global has no
module specifier to `export * from`/`export {x} from`, so the ONLY way to re-export it is
`export const { x } = globalThis;` or a small wrapper function — both are "a non-export statement"
under the brief's literal allowed-forms list (`export *`, `export { a } from './a'`, `export type`,
`export =`). This is systematic, not a one-off like `module/index.ts`: roughly 20 files. Two
directions, either is a real fix, neither attempted here: (a) add `export const {x} = globalThis;`
(a `VariableDeclarator` initialized from a bare `Identifier` or `MemberExpression`, no call, no
function body) to the allowed-forms list as a distinct "global capture" shape, or (b) require every
global pass-through to move its capture into a same-folder wrapper file (`console.ts` beside
`index.ts`) with its own test+proxy, and let `index.ts` re-export THAT via `export { console } from
'./console'` — which already satisfies the rule as written. `packages/node/src/module/index.ts`
(brief's own named example) fails for a different, non-systematic reason: it builds a new object
via `Object.create` and assigns extra properties, real wrapping logic, not a bare global capture —
that one likely needs the wrapper-file split (b), not a new allowed form.

**RESOLVED** — `rule-gateway-colocation-broker`'s purity check now treats a bare
`ImportDeclaration` with zero `specifiers` as pure (a side-effect-only `import 'pkg';` carries no
bindings to speak of, so it cannot be anything BUT a side effect). `jest-dom/index.ts`'s
`import '@testing-library/jest-dom';` now passes as a RuleTester `valid` case; a same-shaped import
that DOES carry a specifier (`import defaultExport from '...'`) stays flagged, proving the check is
specifier-count-based, not package-name-based.

### `import 'pkg';` (side-effect-only, no export) needs its own allowed form

`packages/npm/src/@testing-library/jest-dom/index.ts` is `import '@testing-library/jest-dom';` with
no export at all — the doc's own "a package that needs setup gets wrapped, not passed through...
testing-library always needs app setup" sanctions exactly this shape (jest-dom augments `expect`
globally via side effect, so there is nothing to `export *`). `gateway-colocation`'s purity check
has no case for a side-effect-only `ImportDeclaration` with zero specifiers; it currently reports it
as non-pure, which is defensible (nothing here is a "re-export" in the strict sense) but is worth a
named exception if the lint phase agrees a bare `import 'pkg';` should count as pure.

**RESOLVED** — added `packages/node/src/fs/is-fs-error.proxy.ts` following the guard-proxy pattern
(no mocking; semantic data builders `buildMatchingError`/`buildMismatchedError` over `FsErrorStub`),
and exported `isFsErrorProxy` from `packages/node/src/testing/index.ts` (+ its `index.test.ts`).

### `packages/node/src/fs/is-fs-error.ts` — missing proxy, genuine gap

Not a global or an index — a real function file (`isFsError`) with a colocated `.test.ts` but no
`.proxy.ts`. `gateway-colocation` is correct to flag it: the brief's rule 2 exempts only `index.ts`
and type-only files, and this file exports a real runtime predicate, not just the `FsError`
interface it also carries. Left unfixed per the brief ("do NOT fix gateway files").

### `gateway-layout`: only the case-collision half is a lint rule; the rest needs a unit test per package

The brief's rule 4 names three checks: (a) two sibling folders may never differ only by case, (b) a
folder under `@dungeonmaster/npm` must be an installed package specifier or subpath of one, (c) a
folder under `@dungeonmaster/node`/`@dungeonmaster/browser` must be a Node builtin or a global's
exact name. Only (a) is implemented as the `gateway-layout` rule (zero violations found — no
current gateway folder actually collides, which is the expected outcome given orchestrator ruling
#2 already folded `Buffer` into `buffer`). (b) and (c) are NOT lint rules here:

- (b) needs `@dungeonmaster/npm/package.json`'s own `dependencies`/`peerDependencies` keys compared
  against `packages/npm/src/*` (and nested `@scope/name/*`) folder names — package-specific data a
  lint rule would have to re-read every run; a `package-layout.test.ts` inside `packages/npm` that
  asserts this once, in that package's own ward run, is cheaper and catches drift the moment a
  folder is added without its dependency (or vice versa).
- (c) needs a platform-accurate global list. ESLint's own process runs under Node, so it can
  observe Node's `globalThis` (or reuse `nodeBuiltinStatics`) but NOT the browser's — checking
  `packages/browser/src/*` folder names against the Node process's globals would silently pass
  browser-only names it never saw and fail on ones Node happens to share. A per-package unit test
  using a maintained global list for that package's own platform is the honest version of this
  check; not attempted here.

Also not implemented: the package.json `exports`-shape checks the original lint-plan sketched
(no root `"."` export, folders mirroring literal `exports` entries) — moot under the brief's
override to a single `"./*"` pattern export per package (confirmed live: `packages/{npm,node,
browser,bin}/package.json` already all use exactly `"./*"` + `"./testing"`, no per-subpath literal
entries to compare folders against). What's left to check — that no future edit adds a literal
subpath or a root `"."` entry — is JSON content ESLint's own file globs never reach here (`files:
['**/*.ts', '**/*.tsx', '**/*.js']`), so this too is a `package.json.test.ts`-shaped unit test per
package, not a lint rule.

## Platform-crossing check (ward `platform` subcommand)

Built as `platformCrossingCheckBroker` (`packages/ward/src/brokers/platform-crossing/check/`),
wired as a new ward CLI subcommand — `dungeonmaster-ward platform`, i.e. `npm run ward -- platform`
— rather than a fifth `checkTypeContract` member. Full integration into ward's existing check-type
machinery would touch far more than this one check: `checkTypeContract`/`allCheckTypesStatics` (new
member), `checkCommandsStatics` (this check has no `npx <tool>` command shape — it's in-process),
`cliArgsParseTransformer`'s `--only` parsing, `hasCheckDiscoveryMismatchGuard`/`isCheckTypeGuard`,
`singlePackageLayerBroker`'s per-check dispatch, `multiPackageLayerBroker`'s child-spawn/merge model
(this check is repo-wide, not per-package, so it does not fit "run once per matching workspace
folder"), and every `result-to-*` display transformer (`resultToSummaryTransformer` et al. all
assume a `ProjectResult`/`CheckResult` shape keyed by package + check type). That is the "wiring a
whole check type needs changes across many ward files" case the brief names — so it stayed a
broker + a thin CLI subcommand instead, per the brief's scope limit.

**What full integration would still need**, if a later pass promotes this to a real check type:

1. Add `'platform'` to `checkTypeContract`'s enum and `allCheckTypesStatics`, and decide what
   `checkCommandsStatics` even means for a check with no spawned command — it runs the walk
   in-process, so `checkRunLintBroker`'s "spawn, parse JSON" shape does not fit; it needs its own
   `checkRunPlatformBroker` that calls `platformCrossingCheckBroker` directly and builds a
   `ProjectResult` from the violation list (`errors: ErrorEntry[]`, one per violation, `filePath`
   holding the violating file, `message` holding `platformCrossingViolationDisplayTransformer`'s
   text).
2. Decide where it runs in `commandRunBroker`'s dispatch: it needs the WHOLE workspace's folders and
   the WHOLE import graph in one pass, so it does not fit `singlePackageLayerBroker`'s "one check
   type against one already-known package" loop, and it must not run once per package inside
   `multiPackageLayerBroker`'s per-package child spawn (that would repeat the same repo-wide walk
   once per workspace package for no reason). It most naturally runs ONCE, at the top of
   `commandRunBroker`, before or alongside the per-package dispatch, with its own violations folded
   into one synthetic `ProjectResult` (package name `<repo-root>`, not a real workspace package).
3. `--only platform` needs `isCheckTypeGuard`/the `--only` parser taught the new member; whether it
   also needs to be EXCLUDED from `--committed`/`--uncommitted` (which resolve to a file list, and
   this check ignores file scope entirely — it always walks every browser/node package's whole
   `src/`) is a design call: today's answer is that `-- <files>` and `--committed`/`--uncommitted`
   are silently ignored by this command entirely, since `WardPlatformResponder` takes no flags.
4. `result-to-summary`/`result-to-detail`/`result-to-list` and `storage-save`/`storage-load` all key
   a stored run by `runId` + per-package `ProjectResult[]`; today's `platform` subcommand prints its
   report straight to stdout and saves nothing, so `ward list`/`ward detail` never show a platform
   run. Folding it into `WardResult` so it survives a run and shows up in drill-down is the last
   piece full integration needs.
5. `npm run ward -- dedupe` (built later, see "Two gateway-dependency checks" below) has the identical
   gap for the identical reason — a bare `npm run ward` skips it too, since it is also a repo-wide,
   not per-package, bolted-on subcommand with no stored result. Whoever picks up this integration
   should fix both subcommands in the same pass rather than solving it twice.

**How it runs today:** `npm run ward -- platform` (root) or `npx dungeonmaster-ward platform` from
inside a package. It always checks the whole repo — no `--only`, no file scope, no `--onlyTests`.
Exit code is `wardExitCodeStatics.exitCodes.failing` (1) when it finds any crossing, `0` otherwise
(and nothing is saved to `.ward/`, so `ward list`/`ward detail` do not show it).

**Narrowing depth for barrel-of-barrels.** `barrelProvidesNameTransformer`
(`packages/ward/src/transformers/barrel-provides-name/`) peeks one level into a `star` edge's
target — its own local exports and its own named re-exports — to decide whether an ancestor's
named import could still reach a forbidden gateway import through it. A barrel whose `export *`
line points at ANOTHER pure barrel (rather than a real implementation file) answers `'unknown'`
rather than `'no'`, so the walk still follows it — correct (no false negative), but it means a
deeply nested barrel chain stops getting narrowed at all past the first hop and falls back to
"follow everything downstream", the same over-approximation the brief accepts for a default/
namespace import. Real gateway root barrels (`brokers.ts`, `contracts.ts`, …) are exactly one level
of `export * from './src/<domain>/<action>/<file>'` pointing at real implementation files, so this
does not matter for THIS repo's own barrel shape — it would matter for a barrel re-exporting another
barrel.

**Single-platform npm packages are not detected**, matching Defaults item 6 in
`scrolls/adapters-to-one-place.md`: a browser package importing `@playwright/test` (a Node-only
package) through a bare npm specifier resolves to nothing in `knownPackages` (it is not a workspace
package), so the walk treats it as an external leaf and stops there, the same as any other
unresolvable bare specifier.

**Mirror direction (node-platform reaching `@scope/browser/*`) shares the same code path** — the
entry broker computes `forbiddenPackageNames` per platform and calls the identical
`walkGatewayCrossingsLayerBroker` either way — but is not separately fixture-tested here; the
fixture suite (`platform-crossing-check-broker.integration.test.ts`) only builds a browser-reaching-
node repro, a barrel case and a clean case, per the brief's three named scenarios. A node-platform
mirror fixture (a `cli-tool`- or `http-backend`-typed package reaching `@scope/browser/fetch`) would
be a fourth scenario worth adding before this check is trusted for that direction in anger.

## `@dungeonmaster/bin/git` and `@dungeonmaster/bin/kill` (bin agent)

### Where the lsof+kill combining function belongs

The design (`scrolls/adapters-to-one-place.md` §2) proposed one `@dungeonmaster/bin/port` module
composing `lsof` and `kill` (`listeningPids` + `killByPort` + `portInUse`), because every existing
caller (`processKillByPortAdapter`, `netKillPortAdapter`, `netPortInUseAdapter`) uses the pair
together and never independently. The brief for this build requires one module per program, so this
build split it into `@dungeonmaster/bin/lsof` (`listeningPids`) and `@dungeonmaster/bin/kill`
(`killPid`, `killGroup`) instead. **The composing function — "list what's on this port, then kill
it" — has no home yet.** It is business logic over two bin primitives, not a wrapper around an
outside program, so it belongs in a broker (in whichever package ends up owning port-cleanup
logic — orchestrator and ward each have their own copy today) once the consumption phase migrates
`processKillByPortAdapter`, `netKillPortAdapter` and `netPortInUseAdapter` onto these two modules.

### Reconciliation: "current branch" (async vs sync, detached-HEAD convention)

`@dungeonmaster/bin/git`'s `currentBranch({cwd}) => Promise<string | null>` reconciles:

- `packages/orchestrator/src/adapters/git/current-branch/git-current-branch-adapter.ts` — async,
  returns `{exitCode, output}`, passes the literal string `'HEAD'` through for a detached worktree
  with no special-casing.
- `packages/siegelense/src/adapters/git/branch-read/git-branch-read-adapter.ts` — sync (`execSync`),
  returns `ContentText | null`, maps `''` or `'HEAD'` to `null`, and swallows EVERY failure (missing
  git, not a repo, permission denied, detached HEAD) into that same `null`.

The gateway version is **async** (orchestrator's shape) and returns **`null` for detached HEAD**
(siegelense's convention), but **throws** on a real git failure (non-zero exit, e.g. not a repo)
instead of swallowing it into `null` — closing the gap `scrolls/gateway-build/inventory/child-process-and-bin.md`
§5 names for `gitBranchReadAdapter`. Callers to review at migration:

- Every `gitCurrentBranchAdapter` caller in orchestrator that currently reads the literal string
  `'HEAD'` for a detached worktree must be updated to check for `null` instead, and to stop reading
  `{exitCode, output}` off the result (it is now a plain `string | null`).
- Every `gitBranchReadAdapter` caller in siegelense must switch from a synchronous call to an
  `await`ed one, and must be reviewed for whether it actually wants "not a repo" and "permission
  denied" to now throw rather than read as `null`.

### Reconciliation: `kill` invocation shape (signal + per-pid tolerance)

`@dungeonmaster/bin/kill`'s `killPid({pid, signal = 'SIGKILL'})` reconciles:

- `packages/orchestrator/src/adapters/process/kill-by-port/process-kill-by-port-adapter.ts` — SIGKILL
  (`kill -9 <pid>`), one call PER PID, each independently try/caught (an already-exited pid is
  tolerated, not a failure).
- `packages/ward/src/adapters/net/kill-port/net-kill-port-adapter.ts` — the DEFAULT signal (no `-9`),
  one BATCHED `kill <pids...>` call, and the batch's error argument is ignored outright (so a
  partial failure reads identically to full success — not real tolerance, just an unchecked error).

The gateway version keeps orchestrator's shape: SIGKILL, per-pid, and tolerant only in the sense that
`run` never throws on a non-zero exit — the caller reads `exitCode`/`output` to tell "already gone"
apart from a real refusal. **`netKillPortAdapter`'s callers in ward are the losing side of this
reconciliation** and need review at migration: moving to `killPid` per pid changes the signal sent
(`SIGKILL` instead of the default `SIGTERM`) and makes a partial failure visible instead of silently
swallowed — worth confirming this is what ward's e2e-artifact teardown wants before the swap.

## `parseImplementationImportsTransformer` reads a per-name `type` import as a value import

In a mixed import such as `import { walkBroker, type WalkMemo } from './walk-broker'`, the transformer in `packages/eslint-plugin` does not strip the per-name `type` modifier. `enforce-proxy-child-creation` then expects a `<Type>Proxy` for a type. The platform-crossing check worked around it by deriving types through `Parameters<typeof broker>[0]['field']`. The fix belongs in the transformer: skip specifiers whose `importKind` is `type`.

## A gateway proxy must match the adapter proxy it replaces, or callers duplicate broker logic into their own proxy

`packages/npm/src/glob/glob.proxy.ts` only matched one exact staged pattern string, with no
catch-all and no way to read back a real call — `packages/mcp/src/adapters/glob/find/glob-find-adapter.proxy.ts`
(the adapter it replaced) auto-staged `calledWith([]).resolves([])` in its constructor AND matched
by the pattern's TAIL (tolerating a cwd prefix the staging side never saw), plus exposed
`getOptionsFor` to read back what a call really sent. Losing those meant every composing caller
proxy (`file-scanner-broker.proxy.ts`, `mcp-discover-broker.proxy.ts`) either had to stage every
possible call explicitly or reconstruct the broker's own ignore-list computation inside its test
double — real coupling the adapter never forced. **Checklist for every future gateway wrapper
proxy, before calling it done:**

- [ ] Does the outside function get called MORE THAN ONCE per business operation (a broad scan
      that also sweeps a second root, a probe issued only on the empty-result path)? If so, add a
      safe default (a constructor-time `calledWith([]).resolves(...)`/`.returns(...)`) so an
      unaddressed second call resolves empty/no-op instead of throwing.
- [ ] Does the real call get built by joining a value the CALLER doesn't fully control (a resolved
      cwd, a joined path) onto the value a test naturally wants to stage (the glob/pattern/command
      the caller asked for)? If so, offer a tolerant address — a tail/suffix match, or accept a raw
      predicate function — alongside the exact-match default, so a composing proxy can stage
      without reproducing the join.
- [ ] Does ANY existing adapter proxy for this same npm package/Node module already expose a
      `getOptionsFor`/`getCallsFor`-shaped read-back? If so, the gateway replacement needs the same
      call-inspection surface, not just `returns`/`throws`.
- [ ] Is the replaced adapter's own address narrower than the full real-call argument list (e.g.
      matched on `nodir`/`cwd` but never `ignore`)? Offer a PARTIAL options address (only named
      keys checked) as well as the full exact one, so a caller that cannot know a data-dependent
      option value in advance (an ignore list built by a transformer) can still stage the call.

**Other gateway proxies visibly missing a default and/or call inspection** (found by grepping every
`packages/{npm,node,browser,bin}/src/**/*.proxy.ts` for `calledWith([])` and `callsMatching`; not
fixed here, per this unit's scope):

- Every `packages/bin/git/*.proxy.ts` (all ~18: `git-run`, `git-commit`, `git-current-branch`,
  `git-worktree-add`, etc.) — none stage a catch-all or expose a calls-made read-back.
- `packages/bin/cp/cp-run.proxy.ts`, `packages/bin/cp/cp-copy-recursive.proxy.ts`
- `packages/bin/kill/kill-pid.proxy.ts`, `packages/bin/kill/kill-group.proxy.ts`,
  `packages/bin/kill/kill-run.proxy.ts`
- `packages/bin/lsof/lsof-listening-pids.proxy.ts`
- `packages/bin/npm/npm-run.proxy.ts`, `npm-install.proxy.ts`, `npm-run-build.proxy.ts`,
  `npm-run-script.proxy.ts`
- The read-oriented `packages/node/fs/promises/*.proxy.ts` files (`read-file`, `read-json-file`,
  `readdir`, `readdir-entries`, `realpath`, `readlink`, `stat`, `path-exists`, …) — the write-shaped
  siblings in the same folder (`write-file*`, `append-file*`) already expose `callsMatching`
  read-back; the read-shaped ones do not.
- `packages/node/net/free-port-pair.proxy.ts`, `packages/node/net/is-port-free.proxy.ts`
- `packages/node/readline/line-reader.proxy.ts`, `packages/node/readline/question.proxy.ts`
- `packages/browser/fetch/*.proxy.ts`, `packages/browser/indexedDB/*.proxy.ts`,
  `packages/browser/localStorage/*.proxy.ts`

## Caller-facing lint rules (raw-import-ban, platform-globals-ban, bin-program-spawn-ban)

**RESOLVED** — `platform-globals-ban`'s suggestion text named `@dungeonmaster/node/Buffer` (capital
`B`) instead of the real lowercase `buffer` subpath. Fixed: the rule now falls back to the lowercased
module name for an ambient global whose class name and module name differ only by case (`Buffer` the
class vs. `buffer` the module), the same convention `gatewayPathFromImportSourceTransformer` uses.

All three rules still ship commented out in `configDungeonmasterBroker`
(`packages/eslint-plugin/src/brokers/config/dungeonmaster/config-dungeonmaster-broker.ts`) — their
suggestion text already reads `#gateway/...`. Two things gate turning them on for real:

- Every caller still importing a package raw (not yet switched by Trial 1 or Trial 2 in
  `scrolls/gateway-build/README.md`) fails immediately once `raw-import-ban` goes live.
- The old `@dungeonmaster/<folder>/...` bare-name import form needs banning at the same moment every
  caller has migrated to `#gateway/<folder>/...` — otherwise a caller that switched early and one that
  has not both keep passing.

## Two gateway-dependency checks — RESOLVED 2026-09-26, one gap left

1. **Duplicate installed copies: built as `npm run ward -- dedupe`.** It reads every
   `packages/@gateway/*/package.json` `dependencies`/`peerDependencies` name and fails when one name is
   installed in more than one top-level `node_modules` (repo root or any workspace package). It reads
   the folders directly and never shells out to `npm ls`. Code: `packages/ward/src/brokers/duplicate-install/`.
   **Open: a bare `npm run ward` does not run it**, the same as the `platform` subcommand. Folding a
   whole-repo check into a bare run needs a new check type, a way to run it once per repo instead of
   once per package, and result storage for `ward list`/`ward detail` (see "Platform-crossing check"
   above). Until then, a regression only shows up when someone runs `npm run ward -- dedupe`.
2. **Missing gateway dependency: built as the lint rule `@dungeonmaster/gateway-dependency-declared`,
   switched on.** A file importing `#gateway/<folder>/...` fails unless its nearest `package.json` maps
   that specifier in `imports` and lists the mapped target package in `dependencies` (a test-support
   file may use `devDependencies`). It reads the target name from the `imports` field, so it works for a
   consumer's `@acme/npm` the same as for `@dungeonmaster/npm`. Code:
   `packages/eslint-plugin/src/brokers/rule/gateway-dependency-declared/`.

## Consumer `init`: gateway scaffolding — RESOLVED 2026-09-26, one gap left

`dungeonmaster init` now sets up the gateway in a consumer repo, from `cli`'s install
(`packages/cli/src/responders/install/setup-gateway/`). It scaffolds
`packages/@gateway/{npm,node,browser,bin}` named from the root package's scope; adds
`packages/@gateway/*` to root `workspaces`; merges the four `#gateway` entries into every package's
`imports` field; and merges the `paths` entries into the root `tsconfig.json`, into any package
`tsconfig.json` with its own `paths`, and into each `tsconfig.build.json` (pointing at the gateway
`dist`). Comments in tsconfig files are kept. A second run changes nothing.

**Open: a consumer's first gateway proxy has no `@dungeonmaster/testing` to import.** The scaffolded
gateway packages list no `@dungeonmaster/testing` dev dependency, because that package is not on the
npm registry and `npm install` in a consumer failed with a 404 while it was listed. A proxy needs
`registerMock` from it. Decide how a consumer gets it (publish it, or reach it through the installed
`dungeonmaster` package) before consumers write gateway proxies.

## "Copy, don't reference" is not yet a rule anywhere

Decision 10 in `scrolls/gateway-build/README.md`, section 3: an agent adding a gateway module to a
consumer repo should copy dungeonmaster's own wrapper into the consumer's own
`packages/@gateway/<folder>/`, never import dungeonmaster's copy directly. Open question before this
can become a real rule: where an agent in a consumer repo reads dungeonmaster's gateway SOURCE from —
a published install ships only `dist` (`files: ["dist"]` in every gateway `package.json`), not `src`.
Once decided, the rule belongs in a session snippet
(`packages/shared/src/statics/session-snippet/session-snippet-statics.ts`), not here.

## This worktree's compiled `dist` for mcp and hooks is stale

`packages/mcp/dist` and `packages/hooks/dist` (both present on disk) predate this session's move to
`packages/@gateway/`, so their package-listing tools still answer from the OLD layout. Rebuild both
before relying on either from this worktree.

## ward typecheck's `DISCOVERY MISMATCH` for `@dungeonmaster/npm`

A typecheck run over `@dungeonmaster/npm` reports a file-count mismatch — 144 files vs. 95 discovered —
because the package's built `dist/**/index.d.ts` files enter the same count as its source files. Not a
failure: ward's discovery counts source files, `tsc --listFiles` counts everything the program actually
loads, and a gateway package's own build output is part of that program once it exists.

## Remaining stale JSDoc path examples in eslint-plugin

Three files' `USAGE` examples still show a gateway path from before the `packages/@gateway/` move —
`/repo/packages/node/src/...` instead of `/repo/packages/@gateway/node/src/...`:

- `packages/eslint-plugin/src/brokers/rule/platform-globals-ban/find-ancestor-directory-layer-broker.ts`
- `packages/eslint-plugin/src/brokers/rule/platform-globals-ban/resolve-gateway-scope-layer-broker.ts`
- `packages/eslint-plugin/src/adapters/fs/readdir-sync/fs-readdir-sync-adapter.ts`

Cosmetic — none of the three reads a literal path at runtime, so nothing behaves differently — but
worth fixing in the same pass that next touches any of them.
