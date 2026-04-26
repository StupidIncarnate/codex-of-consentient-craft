# Plan: Consolidated `@dungeonmaster/shared/locations` + `local-eslint` regression rules

## Context

A recurring class of bug: code that needs a file on disk reaches it via `process.cwd()`,
a hardcoded relative literal, or an inline path-shape composition. When the cwd is wrong
(smoketest spawn from `.dungeonmaster-dev/`, hook payload from a subdir, install run from
a sub-package), the code silently picks up the wrong file or no file at all. The most
recent instance was the smoketest haiku spawn losing its MCP server because cwd was
`.dungeonmaster-dev/` and `.mcp.json` is a relative path from repo root. Fix in
`13b291b7` patched that one site (`agent-spawn-by-role-broker.ts:90-91` — runs
`startPath` through `configRootFindBroker`). Same shape of bug is latent in
`chat-spawn-broker`, both `glob-find-adapter` fallbacks, the cli install-context
transformer, and every hook responder that trusts `hookData.cwd`.

Goal: collapse "where does this file live?" and "what cwd should I spawn with?" into a
single shared module, and add lint rules that prevent the same shape of bug from
landing again. Outcome: new code can't reach a file by raw literal, and `process.cwd()`
becomes a seed (only legal at CLI entry points and inside the cwd adapter), never a
target.

**Scope of THIS PR:** ship the infrastructure — statics, resolver brokers,
typed-cwd brand contracts, both lint rules, plus the spawn-cycle wiring that
the brand changes mandate. Existing offenders throughout the codebase
(`process.cwd()` fallbacks, raw location literals, hook-payload trust, etc.)
are NOT cleaned up in this PR. The user is running multiple parallel
rule-writing efforts, and a single coordinated mass-cleanup pass after they
all merge will absorb every offender at once. Rules 1 and 2 will fire on
those sites in the meantime — that's expected and documented.

## Audit summary (already collected, scout reports complete)

**Already consolidated in `@dungeonmaster/shared`:**

- `configRootFindBroker` (`.dungeonmaster.json` walk-up)
- `projectRootFindBroker` (`package.json` walk-up)
- `dungeonmasterHomeFindBroker` / `Ensure` (`~/.dungeonmaster`, env-aware)
- `questsFolderFindBroker` / `Ensure`
- `portResolveBroker` / `portConfigWalkBroker`
- `installCheckBroker`
- `dungeonmasterHomeStatics`, `questsFolderStatics`
- `osHomedirAdapter` (env-aware) / `osUserHomedirAdapter` (strict)
- `claudeProjectPathEncoderTransformer` (`~/.claude/projects/<encoded>/<sid>.jsonl`)

**Hardcoded path-shapes that need consolidation (current leakage sites):**

| Location                                       | Where it leaks today                                                                           |
|------------------------------------------------|------------------------------------------------------------------------------------------------|
| `.claude/settings.json`, `settings.local.json` | `orchestrator/.../spawn-stream-json-adapter:40`, `hooks/.../install-create-settings-responder` |
| `.mcp.json`                                    | `mcp/.../install-config-create-responder`                                                      |
| `event-outbox.jsonl`                           | `orchestrator/.../quest-outbox-append:26`, `quest-outbox-watch:31`                             |
| `ward-results/<id>.json` per quest             | `orchestrator/.../ward-persist-result-broker:32`                                               |
| `.ward/run-<id>.json` workspace-local          | `ward/.../storage-save-broker`                                                                 |
| `guilds/<guildId>/quests/...`                  | `orchestrator/.../quest-resolve-quests-path-broker:21-27`                                      |
| `design/<questFolder>/` scaffold               | `server/.../design-scaffold-broker:27-36`                                                      |
| `subagents/agent-<realAgentId>.jsonl`          | orchestrator chat tail brokers                                                                 |
| `eslint.config.{js,mjs,cjs}`                   | static list exists in `eslint-plugin` but no shared finder                                     |
| `tsconfig.json`                                | string literal `'./tsconfig.json'` in eslint-plugin install                                    |
| `node_modules/.bin/<bin>`                      | inline in `ward/.../bin-resolve-broker:24`                                                     |
| `.dungeonmaster-hooks.config.{js,mjs,cjs}`     | hooks-local, not shared                                                                        |
| `<sessionId>.jsonl` Claude session file        | composed in transformer (encoder is dir-only)                                                  |

**`process.cwd()` usage classification:**

- *Seed-only at entry point* (acceptable): `tooling-smoketest-run-responder:33`,
  `port-resolve-broker:36`, `start-ward.ts:15`,
  `primitive-duplicate-detection-run-responder:32`.
- *Default fallback (lazy)*: `glob-find-adapter` in server, mcp, tooling;
  `eslint-load-config-broker:24`; `spawn-stream-json-adapter:39`. **Banned.**
- *Used as a target*: `cli/.../create-default-install-context-transformer:12-14`
  (sets `targetProjectRoot` and `dungeonmasterRoot` raw — should walk up);
  `installTestbedCreateBroker:75` (seven-`..` walk to repo root — fragile).
  **Banned.**
- *Trusted hook-payload cwd*: every hook responder feeds `hookData.cwd` into ESLint
  config loading without validation. Same bug shape as the spawn bug.

## Approach

Three layers, plus a regression-net of lint rules. Layer choice is driven by the
"everything starts from repo root unless outside repo" rule.

**Monorepo-everywhere assumption.** This codebase is always a monorepo: `.ward/`
exists at the repo root *and* at each workspace package; ward writes per-workspace
results and the root aggregates. Resolvers don't branch on "single vs multi" —
they take a `rootPath` that can be either the repo root or a workspace, both
valid.

**Quest-location env variance.** `~/.dungeonmaster` (user install), `<repo>/.dungeonmaster`
(prod-in-repo dogfood), and `<repo>/.dungeonmaster-dev` (dev-in-repo) are the
three locations dungeonmaster looks in depending on context. The existing
`dungeonmasterHomeFindBroker` already resolves these via the `DUNGEONMASTER_HOME`
env var. Every new resolver in Layer 2 that depends on dungeonmaster-home
(`outboxPathFind`, `guildPathFind`, `questFolderPathFind`, etc.) flows through
that broker, so all three contexts work without per-resolver special-casing.

### Layer 1 — `locationsStatics`

Single source of truth for every filename/dirname literal. Lives at
`packages/shared/src/statics/locations/locations-statics.ts`.

```
locationsStatics.repoRoot.config         = '.dungeonmaster.json'
locationsStatics.repoRoot.mcpJson        = '.mcp.json'
locationsStatics.repoRoot.claude.dir     = '.claude'
locationsStatics.repoRoot.claude.settings        = 'settings.json'
locationsStatics.repoRoot.claude.settingsLocal   = 'settings.local.json'
locationsStatics.repoRoot.tsconfig       = 'tsconfig.json'
locationsStatics.repoRoot.eslintConfig   = ['eslint.config.ts', 'eslint.config.js', '.mjs', '.cjs']
locationsStatics.repoRoot.nodeModulesBin = 'node_modules/.bin'
locationsStatics.repoRoot.dungeonmasterQuests = '.dungeonmaster-quests'
locationsStatics.repoRoot.wardLocalDir   = '.ward'           # also exists per-workspace
locationsStatics.dungeonmasterHome.dir         = '.dungeonmaster'
locationsStatics.dungeonmasterHome.guildsDir   = 'guilds'
locationsStatics.dungeonmasterHome.eventOutbox = 'event-outbox.jsonl'
locationsStatics.dungeonmasterHome.guildConfigFile = 'guild.json'
locationsStatics.guild.questsDir         = 'quests'
locationsStatics.quest.wardResultsDir    = 'ward-results'
locationsStatics.quest.designDir         = 'design'
locationsStatics.quest.questFile         = 'quest.json'
locationsStatics.userHome.claude.dir         = '.claude'
locationsStatics.userHome.claude.projectsDir = 'projects'
locationsStatics.userHome.claude.subagentsDir = 'subagents'
locationsStatics.hooks.configFiles       = ['.dungeonmaster-hooks.config.ts', '.js', '.mjs', '.cjs']
```

Rebuild `dungeonmasterHomeStatics` and `questsFolderStatics` to re-export from here so
existing call sites keep working with no churn.

### Layer 2 — resolver brokers (one per leakage site)

All under `packages/shared/src/brokers/locations/...`. Inputs follow the existing
convention: `startPath: FilePath` (matches `configRootFindBroker:21-23`,
`projectRootFindBroker:23-25`, `questsFolderFindBroker:16-18`); outputs are
`AbsoluteFilePath`. Input/output asymmetry is intentional — caller provides the
walk-up seed in any shape, resolver returns a fully-resolved absolute path.

| Resolver                                                               | Returns                                                              |
|------------------------------------------------------------------------|----------------------------------------------------------------------|
| (existing) `configRootFindBroker`                                      | repo root                                                            |
| (existing) `projectRootFindBroker`                                     | nearest `package.json` dir                                           |
| (existing) `dungeonmasterHomeFindBroker`                               | `~/.dungeonmaster`                                                   |
| (existing) `questsFolderFindBroker`                                    | repo-local quests folder                                             |
| `mcpJsonPathFind({ startPath })`                                       | repo-root + `.mcp.json`                                              |
| `claudeSettingsPathFind({ startPath, kind: 'shared' \| 'local' })`     | repo-root + `.claude/...`                                            |
| `outboxPathFind()`                                                     | dm-home + `event-outbox.jsonl`                                       |
| `guildPathFind({ guildId })`                                           | dm-home + `guilds/<guildId>`                                         |
| `guildConfigPathFind({ guildId })`                                     | guild + `guild.json`                                                 |
| `guildQuestsPathFind({ guildId })`                                     | guild + `quests/`                                                    |
| `questFolderPathFind({ guildId, questId })`                            | guild-quests + `<questId>`                                           |
| `wardResultsPathFind({ questFolderPath })`                             | quest + `ward-results/`                                              |
| `wardLocalRunPathFind({ rootPath, runId })`                            | rootPath + `.ward/run-<id>.json` (rootPath = repo root or workspace) |
| `designScaffoldPathFind({ questFolderPath })`                          | quest + `design/`                                                    |
| `claudeSessionsDirFind({ guildPath })`                                 | userHome + `.claude/projects/<encoded>`                              |
| `claudeSessionFilePathFind({ guildPath, sessionId })`                  | sessions-dir + `<sid>.jsonl`                                         |
| `claudeSubagentSessionFilePathFind({ guildPath, sessionId, agentId })` | sessions-dir + `subagents/agent-<id>.jsonl`                          |
| `eslintConfigPathFind({ startPath })`                                  | first existing of the three variants                                 |
| `tsconfigPathFind({ startPath })`                                      | walk-up to nearest                                                   |
| `nodeModulesBinPathFind({ rootPath, binName })`                        | rootPath + `node_modules/.bin/<bin>`                                 |
| `hookConfigPathFind({ startPath })`                                    | walk-up to first variant (move from `hooks` package)                 |

**Note**: the entry-point cwd seed is an **adapter**, not a broker — it wraps a node global (`process.cwd()`), same
shape as the existing `osHomedirAdapter`. See the dedicated section below.

### Layer 3 — typed CWD brands (Zod-based)

Goal: spawn brokers and hook responders can't take a "wrong-shape" cwd by accident.

Brands follow the existing Zod-branding convention (see
`absolute-file-path-contract.ts:28-32`), not raw TypeScript intersection. Each
brand contract layers on top of `absoluteFilePathContract`:

```ts
// packages/shared/src/contracts/repo-root-cwd/repo-root-cwd-contract.ts
export const repoRootCwdContract = absoluteFilePathContract.brand<'RepoRootCwd'>();
export type RepoRootCwd = z.infer<typeof repoRootCwdContract>;
```

Four brand contracts: `repoRootCwdContract` (contains `.dungeonmaster.json`),
`projectRootCwdContract` (contains `package.json`), `guildPathCwdContract`
(contains `guild.json`), `dungeonmasterHomeCwdContract` (the resolved
`~/.dungeonmaster` / `DUNGEONMASTER_HOME` dir). Each ships with a stub
(`*.stub.ts`) per testing-pattern conventions, and is wired into
`packages/shared/contracts.ts` barrel.

`cwdResolveBroker({ startPath, kind })` walks/validates and parses the result
into the branded contract. The brand can only be obtained through this broker
(or a re-export of it) — direct casts trip the existing `ban-primitives` /
`require-zod-on-primitives` lint rules.

**Spawn cycle wiring (only the orchestrator's Claude-CLI spawn adapter):**

- `agentSpawnUnifiedBroker.cwd: RepoRootCwd` (was `AbsoluteFilePath`)
- `childProcessSpawnStreamJsonAdapter.cwd: RepoRootCwd | undefined` — orchestrator-specific
- `chatSpawnBroker` resolves `guildAbsolutePath` to `RepoRootCwd` before passing
- `agentSpawnByRoleBroker` keeps its existing `configRootFindBroker` call — now typed
- The latent `chat-spawn-broker` bug becomes a TypeScript error

**What does NOT get the brand** (intentional, called out so future work doesn't
over-apply):

- `child-process-spawn-stream-adapter` (shared) — used by ward to spawn
  workspace-cwd subprocesses (`command-run-layer-multi-broker:105-109`). The
  cwd there is a workspace path, not the repo root. Stays `cwd:
  AbsoluteFilePath`.
- `child-process-spawn-capture-adapter` (shared) — generic. Stays
  `AbsoluteFilePath`.

The brand applies only to spawns that reach Claude CLI (which depends on
`.mcp.json` resolution from repo root). Other subprocesses have other valid
cwd shapes.

### Layer 4 — Lint rules (split by audience)

The bug class — LLMs reaching files via raw `process.cwd()` or relative literals —
is not dungeonmaster-specific. Consumer repos that install `dungeonmaster` typically
have their own servers, CLIs, and scripts where the same shape of bug bites
(PM2/systemd/Docker working-dir mismatch, monorepo sub-path invocation, etc.).
That changes the rule placement: rule 1 generalizes and ships; rule 2 stays
local because it reads `locationsStatics` (a dungeonmaster-internal module).

**Rule 1 — `no-bare-process-cwd`** → ships in `@dungeonmaster/eslint-plugin`
(consumer-facing).

`process.cwd()` is banned outside a configurable allowlist.

**Shipped defaults** — minimal, tied to dungeonmaster's package conventions:

```ts
{
  '@dungeonmaster/no-bare-process-cwd': ['error', {
    allowedFiles: ['**/src/startup/start-install.ts'],
    allowedFolders: ['**/src/adapters/process/cwd/**'],
    allowTestFiles: true,  // *.test.ts, *.integration.test.ts, *.harness.ts, *.proxy.ts
  }]
}
```

`start-install.ts` is the one place where cwd-as-target is the deliberate user
contract: `dungeonmaster init` discovers `packages/*/src/startup/start-install.ts`
and runs each, where the user's invocation directory IS the install target.

**Every other call site** uses a new shared adapter (mirrors the existing
`osHomedirAdapter` shape):

```ts
// packages/shared/src/adapters/process/cwd/process-cwd-adapter.ts
// Wraps process.cwd() — the lone allowed call site by folder rule.
export const processCwdAdapter = (): FilePath =>
  filePathContract.parse(process.cwd());
```

Startups (`start-cli.ts`, `start-ward.ts`, `start-mcp-server.ts`,
`start-orchestrator.ts`, `start-server.ts`), the ward command-run broker, and
other CLI seed sites call it via the resolver chain:

```ts
const repoRoot = await configRootFindBroker({ startPath: processCwdAdapter() });
```

This is an adapter (not a broker) per the architecture's "adapters wrap node
globals/npm packages" principle — exact same shape as `osHomedirAdapter`. A
single file is stable and self-documenting; the codebase contains exactly two
legitimate `process.cwd()` call sites: this adapter, and `start-install.ts`.

**Dungeonmaster's own monorepo** doesn't need to extend the allowlist — the
shipped defaults are sufficient because all internal cwd seeds funnel through
`processCwdAdapter`.

**Recommended preset** — rule is ON in the plugin's recommended config alongside
the other architecture rules. Consumers get it for free by extending
`@dungeonmaster/eslint-plugin/recommended`.

Error message stays generic: *"process.cwd() is only valid as a seed at CLI
entry points (default: start-install.ts) or inside a path-resolver broker.
Walk up from a known anchor (package.json, your config file) and pass an
absolute path through your call chain instead."*

**Rule 2 — `no-bare-location-literals`** → `local-eslint` only.

Rule reads `locationsStatics` at lint-startup and dynamically builds its banned
list from every string value in the module (recursing through nested objects
and array members). Adding a new entry to `locationsStatics` automatically
expands the rule's coverage on next lint run — no rule code changes, no
duplicate enumeration. Pseudocode:

```ts
import { locationsStatics } from '@dungeonmaster/shared/statics';
const collectStringValues = (obj: unknown): string[] => /* deep walk */;
const bannedLiterals = new Set(
  collectStringValues(locationsStatics)
    // skip values that would false-positive on common English words
    .filter((s) => /[./]/.test(s) || s.length >= 8)
);
```

The filter (`contains '.' or '/'`, OR length ≥ 8) excludes generic single words
like `'design'`, `'guilds'`, `'projects'` that would hit error messages,
JSDoc examples, and unrelated string usage. ESLint's AST-level Literal nodes
don't include comments by default, so `* USAGE: ...` JSDoc blocks aren't
matched — but the filter is the belt-and-suspenders.

Allowed locations for these literals: `packages/shared/src/statics/locations/**`
and `packages/shared/src/brokers/locations/**` (plus test files via
`allowTestFiles`). Error message points to the matching static key path (e.g.
*"`.mcp.json` belongs to `locationsStatics.repoRoot.mcpJson` — use
`mcpJsonPathFind` instead"*).

**Build-order requirement.** The rule imports `locationsStatics` from
`@dungeonmaster/shared` at lint-startup, so a stale `dist/` produces stale
banned literals (or fails to load if a new key was added). Verification step 1
must build shared FIRST, before any lint run. This matches the existing
`packages/CLAUDE.md` directive: *"After modifying contracts in
`@dungeonmaster/shared`, you MUST rebuild it."*

The generalized version (regex-detect any path-fragment literal anywhere, with
configurable statics module) is a real follow-up rule for the shipped plugin
later — too much false-positive risk to design in this pass.

**Spawn-cycle wiring (required for the brands to compile):**

The brand changes themselves break the build until the spawn cycle is wired up
to produce/consume `RepoRootCwd`. These are the only mandatory backfill sites
in this PR — they're not "offender cleanup," they're part of the brand's
type-flow:

| Site                                            | Change                                                                                                                           |
|-------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| `agent-spawn-unified-broker.ts`                 | `cwd: AbsoluteFilePath` → `cwd: RepoRootCwd`                                                                                     |
| `child-process-spawn-stream-json-adapter.ts:39` | `cwd: AbsoluteFilePath \| undefined` (with `?? process.cwd()` fallback) → `cwd: RepoRootCwd \| undefined`; drop the raw fallback |
| `agent-spawn-by-role-broker.ts:90-91`           | already walks via `configRootFindBroker` — wrap the result with `repoRootCwdContract.parse(...)`                                 |
| `chat-spawn-broker:131`                         | resolve `guildAbsolutePath` to `RepoRootCwd` via `configRootFindBroker` before passing                                           |

**Existing `dungeonmasterHomeStatics` and `questsFolderStatics`** keep their
*current shape* (flat `paths` object) but their values are *built from* the new
`locationsStatics` rather than re-exporting the new shape directly. This
preserves the existing `dungeonmaster-home-statics.test.ts` snapshot. Migrating
callers to `locationsStatics` directly is out of scope for this PR — that
happens in the mass cleanup pass after all the parallel rule-writing work
merges together.

**Existing offenders elsewhere** (`process.cwd()` fallbacks in glob adapters,
hardcoded location literals throughout the codebase, hook-payload-cwd trust,
etc.) are *not* fixed in this PR. They get cleaned up later in a single
coordinated pass that absorbs the offenders surfaced by all the new rules from
parallel work streams. Until then, rule 1 and rule 2 will fire on those sites
when ward runs — that's expected and tracked as a follow-up.

## Out-of-scope (potential follow-ups)

- A generalized "subprocess spawn must take a typed cwd" rule for the published
  `eslint-plugin` is a separate, narrower rule for later.
- A generalized `no-bare-location-literals` (regex-based, configurable statics
  module) for the published plugin is a follow-up — the false-positive design
  work is non-trivial.

## Critical files

**New:**

- `packages/shared/src/statics/locations/locations-statics.ts` (+ test)
- `packages/shared/src/brokers/locations/...` — one folder per resolver in Layer 2
- `packages/shared/src/adapters/process/cwd/process-cwd-adapter.ts` (+ proxy + test) — wraps the lone `process.cwd()`
  call
- `packages/shared/src/contracts/repo-root-cwd/repo-root-cwd-contract.ts` (+ stub + test) — Zod brand on
  `absoluteFilePathContract`
- `packages/shared/src/contracts/project-root-cwd/...` (+ stub + test)
- `packages/shared/src/contracts/guild-path-cwd/...` (+ stub + test)
- `packages/shared/src/contracts/dungeonmaster-home-cwd/...` (+ stub + test)
- `packages/shared/src/brokers/cwd/resolve/cwd-resolve-broker.ts`
- `packages/eslint-plugin/src/brokers/rule/no-bare-process-cwd/...` (shipped)
- `packages/local-eslint/src/brokers/rule/no-bare-location-literals/...`
- `packages/eslint-plugin/src/responders/eslint-plugin/create/...` — register rule 1 in recommended preset

**Modified:**

- `packages/shared/src/statics/dungeonmaster-home/dungeonmaster-home-statics.ts` — values *built from*
  `locationsStatics` while preserving the existing flat `paths` shape (so `dungeonmaster-home-statics.test.ts` snapshot
  stays valid)
- `packages/shared/src/statics/quests-folder/quests-folder-statics.ts` — same pattern
- `packages/shared/contracts.ts`, `brokers.ts`, `statics.ts`, `adapters.ts` — barrel exports
- `packages/orchestrator/src/brokers/agent/spawn-unified/agent-spawn-unified-broker.ts` — `cwd: RepoRootCwd`
- `packages/orchestrator/src/adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter.ts` —
  `cwd: RepoRootCwd | undefined`, drop `?? process.cwd()` fallback
- `packages/orchestrator/src/brokers/agent/spawn-by-role/agent-spawn-by-role-broker.ts` — wrap result with
  `repoRootCwdContract.parse(...)`
- `packages/orchestrator/src/brokers/chat/spawn/chat-spawn-broker.ts` — resolve guild path to `RepoRootCwd` before
  passing
- `packages/local-eslint/src/responders/local-eslint/create/...` — wire rule 2

**Out of scope (cleanup pass after parallel rule work merges):** all the
existing `process.cwd()` and raw-location-literal offenders throughout the
codebase. Rule 1 and rule 2 will surface them; cleanup happens in one
coordinated PR.

## Execution mode

Implement in a git worktree (use the `Agent` tool's `isolation: "worktree"` or
`EnterWorktree`). Reasons: parallel rule-writing is happening on the main tree;
this work introduces a new typed-cwd brand that ripples through every Claude-CLI
spawn caller; lint will fire on existing offenders the moment the rules land
(by design — those are cleaned up later in the coordinated mass pass after all
parallel rule work merges). Worktree isolates this branch until the build is
green and the spawn-cycle wiring is type-correct.

## Verification

1. `npm run build --workspace=@dungeonmaster/shared` FIRST — rule 2 imports
   `locationsStatics` from shared at lint-startup; a stale `dist/` would silently
   use stale literals or fail to load with a cryptic config error.
2. `npm run build` — full monorepo compiles (the `RepoRootCwd` brand changes on
   the spawn cycle propagate through every caller; if any direct caller is
   missing brand-resolution wiring, this is where it surfaces).
3. `npm run ward` — typecheck and tests green. **Lint will fire on existing
   offenders by design** (rule 1 on `process.cwd()` sites, rule 2 on raw
   location literals); those are intentionally left for the post-merge mass
   cleanup pass alongside the other parallel rules. Confirm the only red
   entries are pre-existing offenders, not regressions caused by this PR.
4. `discover({ glob: "packages/shared/src/brokers/locations/**" })` — every
   resolver from Layer 2 exists with a test and proxy.
5. `discover({ grep: "'\\.mcp\\.json'|'event-outbox\\.jsonl'|'\\.claude/settings'" })`
   — every hit is either a known offender (rule 2 will catch it) or lives in
   `packages/shared/src/statics/locations/**`. Document the offender list as
   an artifact for the cleanup pass.
6. `npm run prod` smoketest run (codex guild + smoketests guild): confirms the
   smoketest spawn still finds MCP from `.dungeonmaster-dev/` (the original
   `13b291b7` regression test) and confirms a real chat-spawn from a non-codex
   guild (the latent `chat-spawn-broker` bug) now resolves correctly through
   the new `RepoRootCwd` brand.
