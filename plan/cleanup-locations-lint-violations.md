# Cleanup pass: `no-bare-process-cwd` and `no-bare-location-literals` violations

A previous PR (commit `664f229e` on master) shipped two new ESLint rules plus a consolidated `@dungeonmaster/shared/locations` module. The rules fire on existing offenders by design — those offenders are deferred to **this cleanup pass**. Your job is to make ward fully green by fixing every violation, one file at a time, using the new infrastructure correctly.

## Background you need to know

**Two new rules are now active:**

1. **`@dungeonmaster/no-bare-process-cwd`** (shipped in `@dungeonmaster/eslint-plugin`, in the recommended preset). Bans `process.cwd()` outside an allowlist. Default allowlist: `**/src/startup/start-install.ts` + `**/src/adapters/process/cwd/**` + test files (`*.test.ts`, `*.integration.test.ts`, `*.harness.ts`, `*.proxy.ts`).

2. **`@dungeonmaster-local/no-bare-location-literals`** (private to this monorepo). Reads every string value out of `locationsStatics` at lint-startup and bans those literals from appearing in code outside `packages/shared/src/statics/locations/**` and `packages/shared/src/brokers/locations/**`. Filtered: only literals containing `.` or `/` OR length >= 8 are banned (so generic words like `'design'`, `'guilds'` don't false-positive).

**Why these rules exist:** A class of bugs where code reaches files via raw `process.cwd()` or hardcoded path literals, then silently picks up the wrong file when cwd isn't what was assumed (smoketest spawn from `.dungeonmaster-dev/`, hook payload from a subdir, install run from a sub-package). The recent shape was the smoketest haiku spawn losing its MCP server because cwd was `.dungeonmaster-dev/` and `.mcp.json` is a relative path from repo root.

## The infrastructure you fix violations WITH

All under `packages/shared/`:

- **`@dungeonmaster/shared/statics`** — `locationsStatics` is the single source for every filename/dirname. If you find a literal in code, look it up here and replace via a resolver.
- **`@dungeonmaster/shared/brokers`** — 17+ location resolvers under `brokers/locations/...`:
  - `locationsMcpJsonPathFindBroker({ startPath })` — repo-root + `.mcp.json`
  - `locationsClaudeSettingsPathFindBroker({ startPath, kind: 'shared' | 'local' })`
  - `locationsOutboxPathFindBroker()` — dm-home + `event-outbox.jsonl`
  - `locationsGuildPathFindBroker({ guildId })` — `<dmHome>/guilds/<guildId>`
  - `locationsGuildConfigPathFindBroker({ guildId })` — guild + `guild.json`
  - `locationsGuildQuestsPathFindBroker({ guildId })` — guild + `quests/`
  - `locationsQuestFolderPathFindBroker({ guildId, questId })`
  - `locationsWardResultsPathFindBroker({ questFolderPath })` — quest + `ward-results/`
  - `locationsWardLocalRunPathFindBroker({ rootPath, runId })` — `.ward/run-<id>.json`
  - `locationsDesignScaffoldPathFindBroker({ questFolderPath })` — quest + `design/`
  - `locationsClaudeSessionsDirFindBroker({ guildPath })` — `~/.claude/projects/<encoded>/`
  - `locationsClaudeSessionFilePathFindBroker({ guildPath, sessionId })`
  - `locationsClaudeSubagentSessionFilePathFindBroker({ guildPath, sessionId, agentId })`
  - `locationsEslintConfigPathFindBroker({ startPath })` — walks 4 variants
  - `locationsTsconfigPathFindBroker({ startPath })` — walk-up
  - `locationsNodeModulesBinPathFindBroker({ rootPath, binName })`
  - `locationsHookConfigPathFindBroker({ startPath })` — walks 4 variants
  - `cwdResolveBroker({ startPath, kind: 'repo-root' | 'project-root' | 'guild-path' | 'dungeonmaster-home' })` — returns the correctly Zod-branded cwd
- **`@dungeonmaster/shared/adapters`** — `processCwdAdapter()` returns `FilePath` from `process.cwd()`. This is the **sole** legitimate `process.cwd()` call site outside `start-install.ts`. Any non-startup code that needs cwd-as-seed calls this adapter, then immediately walks up via a resolver (typically `cwdResolveBroker({ kind: 'repo-root' })`).

## How to diagnose a violation's root cause

Don't pattern-match the rule message and slap on a fix. **Categorize the violation first**, then pick the right fix:

### Rule 1 violations (`no-bare-process-cwd`)

For each `process.cwd()` site, ask: *what is cwd being used as?*

- **(a) "Cwd as a target" — the code uses `process.cwd()` as the path it operates on.** Example: `cli/.../create-default-install-context-transformer:12-14` sets `targetProjectRoot = process.cwd()` and `dungeonmasterRoot = process.cwd()` raw. **Wrong** — these should walk up via resolvers from the cwd seed. Fix: replace with `processCwdAdapter()` plus `await configRootFindBroker({ startPath: processCwdAdapter() })` (or `projectRootFindBroker`, depending on which anchor you want).

- **(b) "Lazy fallback default" — `cwd ?? process.cwd()` or a default parameter `cwd = process.cwd()`.** Example: `glob-find-adapter:23` (in server/mcp/tooling) does `cwd: cwd ? String(cwd) : process.cwd()`. **Wrong** — the fallback hides callers that forgot to compute cwd. Fix: drop the fallback. Make `cwd` a required `AbsoluteFilePath`. Each caller now must explicitly resolve cwd, which surfaces (and in turn fixes) more violations upstream.

- **(c) "CLI startup seed" — non-install startup files (`start-cli.ts`, `start-ward.ts`, `start-mcp-server.ts`, `start-orchestrator.ts`, `start-server.ts`) call `process.cwd()` to get the user's invocation directory, then walk up.** Fix: replace `process.cwd()` with `processCwdAdapter()`. The startup is now lint-clean *and* the adapter is the codebase's audit trail of "every legitimate cwd-seed lives here."

- **(d) "CLI seed in a non-startup responder/broker" — e.g. `tooling-smoketest-run-responder:33`, `command-run-broker.ts` (ward), `primitive-duplicate-detection-run-responder:32`.** These are CLI entry points that aren't `start-*.ts` files. Same fix as (c): use `processCwdAdapter()`.

- **(e) "Trusted hook-payload cwd" — `hookData.cwd` parsed via `filePathContract` and used directly.** Example: every `hook-pre-edit-responder.ts:43`, `hook-post-edit-responder.ts:42`, etc. **Wrong** — Claude can be invoked from a subdir; that cwd needs to be walked up to a `RepoRootCwd` anchor before being fed to ESLint config loading. Fix: walk via `cwdResolveBroker({ startPath: filePathContract.parse(hookData.cwd), kind: 'repo-root' })`. **Critical:** wrap the call in a try/catch for `ProjectRootNotFoundError` and *no-op the hook* if the user is outside any dungeonmaster repo (consumer-repo safety — published hooks must degrade gracefully).

- **(f) "Seven-`..` walk to repo root" — `installTestbedCreateBroker:75` does `pathResolveAdapter({ paths: [__dirname, '../../../../../../..'] })`.** Fragile (breaks if dist depth changes). Fix: replace with `configRootFindBroker({ startPath: __dirname })`.

### Rule 2 violations (`no-bare-location-literals`)

The error message tells you which `locationsStatics.*` key path the literal belongs to. Look up the corresponding resolver and replace the inline composition.

- `'.mcp.json'` → `locationsMcpJsonPathFindBroker`
- `'event-outbox.jsonl'` (and inline `dmHome + '/' + 'event-outbox.jsonl'`) → `locationsOutboxPathFindBroker()`
- `'.claude/settings.json'` → `locationsClaudeSettingsPathFindBroker({ startPath, kind: 'shared' })`
- `'ward-results'` (subdir of quest folder) → `locationsWardResultsPathFindBroker({ questFolderPath })`
- `'.ward'` (workspace-local ward dir) → `locationsWardLocalRunPathFindBroker({ rootPath, runId })`
- `'guilds'` + `<guildId>` + `'quests'` → `locationsGuildQuestsPathFindBroker({ guildId })` (or the chain: `guildPath` → `guildConfigPath` → `guildQuestsPath` → `questFolderPath`)
- `'design'` (under quest folder) → `locationsDesignScaffoldPathFindBroker({ questFolderPath })`
- `'subagents/agent-<id>.jsonl'` → `locationsClaudeSubagentSessionFilePathFindBroker(...)`
- `<sessionId>.jsonl` → `locationsClaudeSessionFilePathFindBroker(...)`
- `'eslint.config.{js,mjs,cjs,ts}'` literal anywhere → `locationsEslintConfigPathFindBroker`
- `'./tsconfig.json'` → `locationsTsconfigPathFindBroker`
- `'node_modules/.bin/<bin>'` → `locationsNodeModulesBinPathFindBroker({ rootPath, binName })`
- `.dungeonmaster-hooks.config.{ts,js,mjs,cjs}` → `locationsHookConfigPathFindBroker({ startPath })` (and consider whether the `packages/hooks` package's `hookConfigLoadBroker` should now delegate path-resolution to this shared one — it currently does its own variant probe).

## Common pitfalls

1. **Don't loosen contracts to make a violation go away.** If `cwd: AbsoluteFilePath` rejects a value, fix the call site to pass an absolute path, don't change the parameter to `string`.

2. **Don't add `// eslint-disable-next-line` to silence a violation.** If you can't see how to fix it, that's signal — escalate, don't suppress.

3. **Watch for transitive type-flow.** When you replace `cwd: AbsoluteFilePath` with `cwd: RepoRootCwd` on an internal function, every caller must also be updated to produce `RepoRootCwd` (typically via `cwdResolveBroker({ kind: 'repo-root' })`). Run `npm run build` frequently to surface what propagated.

4. **Build shared first.** Rule 2 reads `locationsStatics` from the `dist/` of `@dungeonmaster/shared`. If you modify the shared package and don't rebuild, lint will use stale literals (or fail to load with a cryptic config error). After ANY edit in `packages/shared/src/`, run `npm run build --workspace=@dungeonmaster/shared` before linting.

5. **Test files are auto-allowed for both rules.** If a violation fires inside a `*.test.ts`/`*.proxy.ts`/`*.harness.ts`/`*.integration.test.ts`, that's a bug in the rule's allowlist matching — don't fix the test, diagnose the rule. (But you probably won't see this; the rules already exclude these.)

6. **Hook responders need ProjectRootNotFoundError handling.** When walking up `hookData.cwd`, the user might be running Claude in a non-dungeonmaster repo. Catch the error and no-op gracefully. Don't crash the hook.

7. **`process.cwd()` calls inside resolver brokers are intentional.** `port-resolve-broker:36` uses it as a walk-up seed fallback when no startDir is provided. This is correct and is in the allowlisted folder. If you see one of these, leave it.

## Workflow per violation

1. Read the violation's file:line.
2. Categorize the violation per the diagnosis sections above (which "shape" of bug is it?).
3. Identify the right fix (which resolver / which adapter).
4. Make the change.
5. Run `npm run ward -- --only lint -- <path>` scoped to the changed file. Confirm the violation is gone and no new ones appeared.
6. If the fix changed a function signature, run `npm run build` to surface propagation. Fix transitively.
7. Run scoped unit tests for any file you touched.
8. Repeat for the next violation.

## Output

When done, full `npm run ward` should be green. Report the count of violations fixed per category, files touched, and any propagated transitive changes.
