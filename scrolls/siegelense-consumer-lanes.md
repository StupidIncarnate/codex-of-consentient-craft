# siegelense consumer lanes — design for DEF-32 to DEF-35

## 1. The goal

siegelense only ever boots dungeonmaster's own app. The user wants it to boot and drive ANY repo it
is installed in. Their decisions, verbatim (`scrolls/walkthrough/LEDGER.md`, 2026-09-23):

1. siegelense boots and drives the consumer's own app, the same way the consumer's Playwright e2e
   tests boot it.
2. Whatever siegelense needs is stored in `.dungeonmaster.json`. `dungeonmaster init` sets up the
   commands so each run gets its own ports. It must be generic, because the user runs the same setup
   on other repos.
3. siegelense has no fake-Claude mechanism of its own. It fakes exactly what the repo's Playwright
   setup fakes.
4. The smoke-test playbook is deleted. `dungeonmaster init` adds a `hydration-recipes` folder when a
   repo has none.

DEF-32 is the lane itself. DEF-33 is `init` wiring the ports. DEF-34 is the playbook deletion —
decision 4's first half already settles it, so this scroll treats it as resolved, not open. DEF-35 is
the hydration-recipes scaffold — decision 4's second half, and it turns out mostly already built.

## 2. What exists today

**Two closed lane specs carry this repo's own shape as static data.**
`packages/siegelense/src/statics/lane-spec/lane-spec-statics.ts:39-89` defines `API_PROCESS` (command
`npm run dev:no-watch --workspace={apiWorkspace}`, `readyPath: '/api/guilds'`, env
`FAKE_CLAUDE_QUEUE_DIR`/`FAKE_WARD_QUEUE_DIR`) and `WEB_PROCESS`, then wires them into two named specs,
`dungeonmaster-stack` (both processes, `browser: true`) and `dungeonmaster-api` (api only,
`browser: false`). `{apiWorkspace}`/`{webWorkspace}` already resolve generically — off
`laneWorkspaceResolveBroker` (`packages/siegelense/src/brokers/lane/workspace-resolve/lane-workspace-resolve-broker.ts`),
which finds the one `packages/*` directory whose detected `packageType` matches `http-backend` or
`frontend-react`, by scanning disk, never a hardcoded name. That part of the design is already
portable. `readyPath: '/api/guilds'` is not — it names a route only dungeonmaster's own server
answers.

**`lane-spec-find-broker.ts:17-27` refuses every other name.** It is a closed lookup:
`Object.hasOwn(laneSpecStatics.specs, specName)`, throwing `Unknown lane spec "<name>". Known specs:
dungeonmaster-stack, dungeonmaster-api` otherwise. `SpecName` itself
(`packages/siegelense/src/contracts/spec-name/spec-name-contract.ts:16`) is an OPEN branded string —
`z.string().min(1).brand<'SpecName'>()` — not a closed enum. The closedness lives entirely in this one
broker's static lookup, not in the type.

**`lane-boot-broker.ts:104-144` requires a fake Claude/ward CLI, and knows where to look for one only
in this checkout.** When `spec.requiresFakeAgentCli` is true and the caller has not set
`CLAUDE_CLI_PATH`/`WARD_CLI_PATH`, it scans disk for
`packages/web/test/harnesses/claude-mock/bin/claude` and
`packages/orchestrator/test-fixtures/fake-ward-bin/dungeonmaster-ward`
(`packages/siegelense/src/statics/fake-agent-cli/fake-agent-cli-statics.ts:14-35`), and throws
`FakeAgentCliRequiredError` when neither the env var nor the fixture is found. Both specs declare
`requiresFakeAgentCli: true`. A consumer repo has neither fixture, so `start` refuses before spawning
anything, every time.

**The orchestrator hard-codes which spec to boot.**
`packages/orchestrator/src/statics/lane/lane-statics.ts:15-19`: `laneStatics.defaults.specName =
'dungeonmaster-stack'`, restated (its own header says) because the orchestrator cannot statically
import `@dungeonmaster/siegelense` — that would be a cycle — so it cannot read the name off
`laneSpecStatics` directly. `lane-provision-batch-broker.ts:86-91` reads that constant and passes it,
unchanged, to both `capacityReadBroker` and `instanceStartBroker` (dynamically imported from
`@dungeonmaster/siegelense/brokers`). This broker needs no structural change: it already treats the
spec name as an opaque string it is handed, not one it computes.

`capacityStatics.defaults.specName` (`packages/siegelense/src/statics/capacity/capacity-statics.ts:42-47`)
derives the same name off `laneSpecStatics.specs['dungeonmaster-stack'].name` rather than retyping it,
specifically to avoid the two drifting apart — the same discipline this design has to preserve once
`laneSpecStatics` stops being static data.

**Nothing in siegelense reads `.dungeonmaster.json`.** `dungeonmasterConfigContract`
(`packages/config/src/contracts/dungeonmaster-config/dungeonmaster-config-contract.ts:68-110`) already
carries a `devServer` block — `devCommand`, `port`, `webPort` (optional, for a split
api/frontend app), `buildCommand`, `readinessPath`, `readinessTimeoutMs` — written today by
`InstallCreateConfigResponder` (`packages/config/src/responders/install/create-config/install-create-config-responder.ts:46-59`)
with generic defaults (`npm run dev`, `npm run build`, port `3738`). In THIS repo,
`devServer.devCommand` is read by exactly one thing, and it is not code: a SESSION prompt
(`tavernkeeper-prompt-statics.ts:86`) instructs the follow-up-chat agent to read it and run it by hand.
The root `npm run dev` script (`package.json:20`) reads `devServer.port` directly via a `node -e` call
but hardcodes its own two workspace names (`@dungeonmaster/server`, `@dungeonmaster/web`) rather than
reading `devCommand` — this repo's own dev script has never needed the field to be generic, because it
IS the one-off. `devServer.devCommand`/`buildCommand` are real, validated, defaulted config fields
sitting almost unused.

**This repo's own e2e config does not read `.dungeonmaster.json` either — it recomputes the same
shape by hand.** `packages/web/playwright.config.ts:17-33` reads `DUNGEONMASTER_PORT`/
`DUNGEONMASTER_WEB_PORT` from the environment (falling back to `5737`/`+1`), resolves the http-backend
workspace generically by scanning `packages/*/src/adapters` for a hono/express adapter
(`:46-81`, `hasHonoOrExpressAdapterGuard` — the same technique `laneWorkspaceResolveBroker` already
uses, reimplemented a second time in a `.ts` config file), and hardcodes the two fake-CLI fixture paths
(`:26-32`). Its `webServer` array (`:137-196`) is two entries: `npm run dev:no-watch --workspace=<resolved
name>` for the API (env carries `CLAUDE_CLI_PATH`, `WARD_CLI_PATH`, the two `FAKE_*_QUEUE_DIR` vars,
`E2E_SIGNAL_BACK_HTTP`, `DUNGEONMASTER_RATE_LIMITS_POLL_MS`), and `npx vite preview --strictPort
--outDir <bundle>` for the built web bundle. This file is this repo's own dogfood config — it is never
shipped — so nothing here needs editing for portability. It matters as evidence: it is the measured
shape decision 1 says to copy.

**The scaffolded consumer Playwright config is a hand-edit-me template, and does not read
`.dungeonmaster.json` either.** `dungeonmaster init` writes
`packages/cli/src/statics/playwright-config-template/playwright-config-template-statics.ts:14-90`
verbatim into a fresh consumer repo. It has ONE `webServer` entry with `command: 'npm run
dev:no-watch'` — literal text the consumer must replace by hand, with a large prose comment
explaining why the script must not watch — and reads the same
`DUNGEONMASTER_PORT`/`DUNGEONMASTER_WEB_PORT` env-var convention, default `3737`/`+1`. This is the
"same way the consumer's Playwright e2e tests boot it" decision 1 names, in the one form `dungeonmaster
init` already ships to every consumer — but today it is a config file a person edits, not something
`.dungeonmaster.json` drives.

**Fakes are already env-var-shaped, not siegelense-shaped.** `laneBootBroker` already inherits
`process.env` wholesale and merges the spec's own substituted env over it (`:94-98`, `:227-235`). The
ONLY siegelense-specific thing standing between "inherit whatever the caller set" and "boot" is the
`requiresFakeAgentCli` disk-scan-and-throw block. Playwright's OWN fake-CLI wiring is nothing more than
setting four env vars on a spawned child (`playwright.config.ts:161-164`) — it has no parallel
resolution mechanism of its own either.

**`InstallRecipesScaffoldResponder` already exists**
(`packages/siegelense/src/responders/install/recipes-scaffold/install-recipes-scaffold-responder.ts:34-68`),
wired into siegelense's own `InstallFlow`. It creates `packages/hydration-recipes/src/` — an EMPTY
directory — when the package is absent, and leaves an existing one untouched. Its own header states the
philosophy: an empty folder answers "no recipes yet"; a missing one can only mean "something is wrong."
What it does NOT do: write a `package.json`, `tsconfig.json`/`tsconfig.build.json`, or an `index.ts`.
`recipesLocateBroker` (`packages/siegelense/src/brokers/recipes/locate/recipes-locate-broker.ts:26-51`)
resolves the package by the fixed convention `recipesConventionStatics.package.{workspaceDirName,dirName}`
(`packages`, `hydration-recipes`) and then requires `dist/index.js` to exist, throwing
`RecipesBuildMissingError` when it does not. Nothing ever builds the scaffolded folder, because it is
not a real npm package — no `package.json` means no build script, no workspace membership, nothing
`npm run build` can act on. So `recipesLocateBroker` throws `RecipesBuildMissingError` in every fresh
consumer repo, forever, until a human manually turns the empty folder into a real package by hand (for
example with `dungeonmaster create-package`). The scaffold exists; what it produces cannot build. This
is DEF-35's gap.

**DEF-26 is in flight, in a separate worktree, and changes `docs --for <scope>`.** The user's DEF-26
decision (same ledger entry) deletes the `planning` and `driving` docs scopes out of
`siegelenseCallStatics.docs.scopes` (`packages/siegelense/src/statics/siegelense-call/siegelense-call-statics.ts:34-36`,
today `['planning', 'walking', 'attacking', 'fixing', 'driving']`) and `docs-statics.ts`'s matching
content. This design depends on none of that content and touches neither file — the DEF-26 worktree
owns `docs-scope-contract.ts`, `docs-statics.ts`, `siegelense-call-statics.ts`, and the orchestrator
prompt statics and session snippets that point at them.

**The playbook is stale and one CLAUDE.md pointer is already dangling.** `playbook/` holds four
`smoketest-*.md` files (`smoketest-instances.md`, `smoketest-mcp-handoff.md`,
`smoketest-mcp-orchestration.md`, `smoketest-orchastrator.md`). Root `CLAUDE.md` reads `See
playbook/smoke-testing.md for manual verification steps.` — that file does not exist. The user's
decision 4 deletes the whole playbook.

**Design notes call this open "item 17."** `scrolls/seigelense/siegelense-tooling.md:2112`: "The lane
spec and N ports; move it where consumers get it," naming exactly the literals above as what has to
go, with no design behind it until now.

## 3. Design

### 3.1 The `.dungeonmaster.json` shape

Extend `dungeonmasterConfigContract`'s existing `devServer` block rather than inventing a sibling
top-level key — `buildCommand`/`readinessTimeoutMs` are shared concerns between the interactive dev
server and a siege lane, and keeping one config family means one place to read the comments. Add one
new nested, optional field, `e2e`:

```ts
devServer: z.object({
  // ...existing fields: devCommand, port, webPort, buildCommand, readinessPath,
  // readinessTimeoutMs — all unchanged...
  e2e: z
    .object({
      processes: z
        .array(
          z.object({
            // 'api' | 'web' by convention, open string so a spec with only one process (a
            // single-server app) still validates
            name: z.string().min(1).brand<'E2eProcessName'>(),
            // A complete, already-composed, NO-WATCH shell command — may reference the same
            // {apiPort} / {webPort} / {apiWorkspace} / {webWorkspace} tokens
            // lanePlaceholderSubstituteTransformer already substitutes today. A free-form string,
            // exactly like Playwright's own `webServer[].command` — not a parsed argv array, so a
            // consumer authors it exactly the way they already author a Playwright webServer entry.
            command: z.string().min(1).brand<'E2eCommand'>(),
            portRole: z.enum(['api', 'web']),
            readyPath: z.string().min(1).brand<'ReadinessPath'>(),
          }),
        )
        .min(1),
    })
    .optional(),
}).optional(),
```

Two things this sketch deliberately leaves alone: `devServer.port`/`webPort` stay the SAME fields the
interactive dev server already uses for per-run port defaults — `e2e` does not repeat them, because the
real port for a run is never a fixed config number; see 3.3. And `command` is a single string spawned
through a shell (`sh -c <command>`), not split into `command`/`args` the way the two retired
`LaneProcess` templates were — that split existed because those templates were hand-written TypeScript
objects; a JSON config field matches Playwright's own `command` string shape instead.

### 3.2 How a lane boots from it

**A new adapter, precedented by the orchestrator's own.** The orchestrator already resolves
`.dungeonmaster.json` generically through its own thin wrapper,
`packages/orchestrator/src/adapters/dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter.ts`,
which calls `@dungeonmaster/config`'s `configResolveBroker` internally (per its proxy's own comment).
Architecture rule: a broker never imports an npm-package-shaped boundary directly, an adapter does. So
siegelense gets the same shape:
`packages/siegelense/src/adapters/dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter.ts`,
wrapping the SAME `configResolveBroker`. This is the one new cross-package dependency the design adds:
`packages/siegelense/package.json` gains `"@dungeonmaster/config": "*"`.

**`laneSpecFindBroker` stops being a static lookup and becomes a derivation, so it becomes ASYNC.**
Today it is `({ specName }: { specName: SpecName }): LaneSpec` — synchronous, because
`laneSpecStatics` is data sitting in memory. Once the spec is built from a file on disk it must
`await` that read, so its signature becomes `async ({ specName }): Promise<LaneSpec>`. Every real
caller updates to `await` it — by grep, that is exactly ONE production call site,
`instance-start-broker.ts:120` (`const spec = laneSpecFindBroker({ specName });`). Every other hit on
`laneSpecFindBroker`/`SpecNameStub` across the tree is a unit test stubbing a `SpecName` string for
unrelated assertions (capacity math, table rendering, contract shape) that never resolves it against a
real spec — those do not change, because `SpecName` stays the same open branded string it always was.

**The broker's new body:**

1. Resolve `.dungeonmaster.json` via the new adapter, off the process cwd (same
   `cwdResolveBroker`/`processCwdAdapter` pair `lane-boot-broker.ts` already uses to find `repoRoot`).
2. Read `config.devServer?.e2e?.processes`. Absent means no e2e lane is configured for this repo yet —
   throw a new, specific error (see 3.6) rather than the old "Unknown lane spec" message, since the
   spec NAME was valid, the CONFIG is what is missing.
3. Look `specName` up against `laneSpecConventionStatics` (new, small: `{ browsered: 'stack', headless:
   'api' }`) to decide `browser: boolean`. An unrecognised name still throws — the closed set shrinks
   from "two whole app shapes" to "two ways of running the SAME configured processes," which is a much
   smaller thing to keep closed.
4. Build each `LaneProcess` from a configured entry: `command: 'sh'`, `args: ['-c', entry.command]`,
   `portRole: entry.portRole`, `readyPath: entry.readyPath`, `logFileName` off
   `locationsStatics.siegelense.{apiLog,webLog}` keyed by `portRole` (unchanged convention), `env: {}`.
5. Parse the assembled object through `laneSpecContract` (unchanged, minus the field in 3.4).

**Everything below the spec is untouched.** `lane-boot-broker.ts`'s substitution machinery
(`laneEnvSubstituteTransformer`, `lanePlaceholderSubstituteTransformer`,
`laneProcessPortResolveTransformer`), its mkdir/spawn/wait/teardown sequence, and
`laneWorkspaceResolveBroker` for `{apiWorkspace}`/`{webWorkspace}` all keep working exactly as they do
today — they already operate on a `LaneSpec` value, never on where that value came from.

### 3.3 How per-run ports reach the app

Unchanged — this half is already fully generic and needs no design. `instanceReserveBroker` claims an
OS-assigned free `PortPair` before `laneBootBroker` runs; `{apiPort}`/`{webPort}` tokens are substituted
into args, env and `readyPath` at boot time, exactly as `API_PROCESS`/`WEB_PROCESS` already do. A
configured `command` string that embeds `{apiPort}`/`{webPort}` (for example `npm run dev:no-watch
--workspace=@scope/server` with `DUNGEONMASTER_PORT={apiPort}` set through the process's own `env`
block — which does not exist per-process in the sketch above, so a configured process that needs a
literal port IN its command string, rather than via env, writes the token directly into `command`)
gets it filled in the same way. `devServer.port`/`webPort` in config remain the INTERACTIVE dev
server's own defaults; they are never read for a siege run's actual port numbers — a run's ports are
always freshly claimed, exactly as the two retired specs already behaved.

### 3.4 How fakes reach the app

Decision 3 is a deletion, not a new mechanism. `lane-boot-broker.ts` already builds `inheritedEnv` from
`process.env` and merges it under the spec's own env (`:94-98`). Delete the
`spec.requiresFakeAgentCli` block (`:104-144`) entirely, delete the `requiresFakeAgentCli` field off
`laneSpecContract`, delete `fake-agent-cli-statics.ts` and `FakeAgentCliRequiredError`. What is left is
exactly Playwright's own model: a caller that wants a lane to talk to a fake Claude/ward CLI exports
`CLAUDE_CLI_PATH`, `WARD_CLI_PATH`, `FAKE_CLAUDE_QUEUE_DIR`, `FAKE_WARD_QUEUE_DIR` into ITS OWN shell
before invoking `dungeonmaster siegelense start` — the same four variables
`packages/web/playwright.config.ts`'s `webServer[0].env` already sets for the child IT spawns. That
file needs no edit: it is this repo's own dogfood config, never shipped, and it is already the thing
being reused, not a thing that itself needs to change. A repo whose app has nothing to do with Claude
or ward (almost every consumer) simply never sets those four variables, and siegelense never asks for
them — the concept of "a fake agent CLI" stops being something siegelense knows about at all.

`{claudeQueueDir}`/`{wardQueueDir}` placeholders and the per-instance queue-dir mkdir
(`lane-boot-broker.ts:151-157`) stay — they are a generic "give this instance its own throwaway
directory for whatever it needs" mechanism, not dungeonmaster-specific, and cost nothing to keep for
the one repo that does use them.

### 3.5 How the orchestrator picks the lane

`laneProvisionBatchBroker` needs no structural change — it already treats
`laneStatics.defaults.specName` as an opaque string handed to `capacityReadBroker`/`instanceStartBroker`
across the dynamic-import boundary. Two values change:

- `laneStatics.defaults.specName` (orchestrator) — from `'dungeonmaster-stack'` to the new convention
  name (`'stack'`), same restated-not-guessed rationale its header already carries, new value.
- `capacityStatics.defaults.specName` (siegelense) — today derived off
  `laneSpecStatics.specs['dungeonmaster-stack'].name`; once `laneSpecStatics` stops being a static data
  object, this instead reads `laneSpecConventionStatics.browsered` (the same new statics 3.2 step 3
  introduces), preserving the "one place, no drift" discipline the current comment states.

### 3.6 How `init` writes the config and scaffolds hydration-recipes

**Config.** `InstallCreateConfigResponder` gains one more seeded field alongside its existing
`devServer` defaults: `devServer.e2e.processes: [{ name: 'app', command: 'npm run dev:no-watch',
portRole: 'api', readyPath: '/' }]` — a single placeholder entry, the same "one script most repos do
not have yet, so npm fails loudly next to a comment saying what to point it at" strategy the scaffolded
Playwright template already uses for its lone `webServer` entry. A split api/web app adds a second
entry by hand, same as the template today tells a consumer to add a second `webServer` array entry.

**Playwright, regenerated to read the SAME block.** This is the concrete answer to decision 3's open
question — read `.dungeonmaster.json`, not `playwright.config.ts`, and have BOTH sides consume it.
Reasons: `playwright.config.ts` is arbitrary executed TypeScript, not data — THIS repo's own copy
computes its workspace name by scanning `src/adapters/` at config-load time (`:46-81`), a thing no
generic parser can safely or honestly replicate for an unknown consumer's config shape. Parsing it
would mean either running consumer code to introspect it (heavy, unsafe for a published CLI to do
automatically) or pattern-matching its source text (brittle — the exact trap `no-hardcoded-package-names`
already waves through for this file per `siegelense-tooling.md:2122-2125`). A JSON config validated by
a zod contract has neither problem, and it is already the tool's own established shape for every other
runtime knob. So `playwright-config-template-statics.ts`'s scaffolded `webServer` entry changes from a
literal `command: 'npm run dev:no-watch'` line the consumer edits in a `.ts` file, to a small block that
imports `@dungeonmaster/config` and maps `devServer.e2e.processes` into Playwright's `webServer` array
at config-load time. After the first `dungeonmaster init`, a consumer edits their dev command in
EXACTLY ONE place — `.dungeonmaster.json` — and both Playwright and siegelense pick it up from there.
The prose comment that today tells a consumer to replace `command: 'npm run dev:no-watch'` moves to
telling them to edit `devServer.e2e.processes[0].command` in `.dungeonmaster.json` instead; the
"make it a no-watch script" warning stays exactly as it reads today.

**Hydration-recipes.** `InstallRecipesScaffoldResponder` stops writing a bare empty `src/` directory
and instead writes a complete, minimal, buildable package: `package.json` (name
`<scope>/hydration-recipes`, a `build`/`build:clean` script pair matching the shape every other package
in this tree carries per `packages/CLAUDE.md`), `tsconfig.json` + `tsconfig.build.json`, and a starter
`src/index.ts` exporting the three names `recipesConventionStatics.exports` requires — a trivial
manifest, a listing function returning `[]`, and a seed function that throws a clear "no recipes
defined yet, add one under packages/hydration-recipes/src/recipes-<name>/" message. This is the SAME
philosophy `InstallRecipesScaffoldResponder`'s own header already states — "an empty folder is a real
answer where a missing one is not" — carried one level further: an empty PACKAGE that builds and
answers an empty listing is a real answer; an empty folder nothing can ever build is not. This stays a
direct file-write inside `packages/siegelense`'s own responder (not a call into `packages/cli`'s
`create-package` scaffolding machinery) — that machinery is general-purpose and user-invoked; this
responder targets one fixed, narrow package shape, and writing its handful of template strings directly
keeps the two scaffolders' ownership separate.

### 3.7 This repo's own `.dungeonmaster.json` under the new design

Dogfooding keeps working because this repo becomes an ordinary consumer of its own tool. Its
`.dungeonmaster.json` gains:

```json
"devServer": {
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "port": 4750,
  "webPort": 4751,
  "readinessPath": "/",
  "readinessTimeoutMs": 45000,
  "e2e": {
    "processes": [
      {
        "name": "api",
        "command": "npm run dev:no-watch --workspace=@dungeonmaster/server",
        "portRole": "api",
        "readyPath": "/api/guilds"
      },
      {
        "name": "web",
        "command": "npx vite preview --strictPort --outDir packages/web/dist",
        "portRole": "web",
        "readyPath": "/"
      }
    ]
  }
}
```

No fake-CLI variables appear here — those stay sourced from whoever's shell invokes
`dungeonmaster siegelense`, per 3.4. `packages/web/playwright.config.ts` can, as a later cleanup, read
this SAME `e2e.processes` block instead of recomputing `HTTP_BACKEND_WORKSPACE` and the two `command`
strings by hand — but that migration is optional polish, not required for DEF-32 to land, since that
file is not shipped and nothing in decisions 1-4 asks for it to change.

## 4. What gets deleted

| What | Where | Why |
|---|---|---|
| The two closed spec objects, `API_PROCESS`/`WEB_PROCESS` templates, `dungeonmaster-stack`/`dungeonmaster-api` entries | `packages/siegelense/src/statics/lane-spec/lane-spec-statics.ts` (whole file) | replaced by the config-derive broker; a small `laneSpecConventionStatics` file takes its place |
| The closed `Object.hasOwn` lookup and its "Unknown lane spec… Known specs: …" message | `packages/siegelense/src/brokers/lane-spec/find/lane-spec-find-broker.ts:17-27` | replaced by the config-derive body in 3.2 |
| The `requiresFakeAgentCli` block: disk scan, env-var check, throw | `packages/siegelense/src/brokers/lane/boot/lane-boot-broker.ts:104-144` | `inheritedEnv` already covers it |
| `fakeAgentCliStatics` | `packages/siegelense/src/statics/fake-agent-cli/fake-agent-cli-statics.ts` | no longer read anywhere |
| `FakeAgentCliRequiredError` (+ its test) | `packages/siegelense/src/errors/fake-agent-cli-required/` | no longer thrown anywhere |
| `requiresFakeAgentCli` field | `packages/siegelense/src/contracts/lane-spec/lane-spec-contract.ts:42`, its USAGE comment blocks in this file and in `lane-boot-broker.ts`'s own header | the field it names is gone |
| The fake-agent-CLI example string | `packages/siegelense/src/contracts/boot-failure-marker/boot-failure-marker.stub.ts:14` | illustrates a refusal path that no longer exists |
| The `laneSpecStatics`-derived value | `packages/siegelense/src/statics/capacity/capacity-statics.ts:46` | replaced per 3.5 |
| `'dungeonmaster-stack'` literal | `packages/orchestrator/src/statics/lane/lane-statics.ts:17` | replaced per 3.5 |
| Bare `fsMkdirAdapter` body | `packages/siegelense/src/responders/install/recipes-scaffold/install-recipes-scaffold-responder.ts:34-68` | replaced by the real scaffold in 3.6 |
| Hardcoded `command: 'npm run dev:no-watch'` webServer entry | `packages/cli/src/statics/playwright-config-template/playwright-config-template-statics.ts` | replaced by the config-reading version in 3.6 |
| Four stale playbook files | `playbook/smoketest-instances.md`, `smoketest-mcp-handoff.md`, `smoketest-mcp-orchestration.md`, `smoketest-orchastrator.md` | DEF-34, resolved by the user's decision |
| The dangling pointer | root `CLAUDE.md`, `See playbook/smoke-testing.md for manual verification steps.` | names a file that was never real |

**Left alone, on purpose:** `laneWorkspaceResolveBroker` and the `{apiWorkspace}`/`{webWorkspace}`
tokens — already generic, still useful to a consumer who wants to write `--workspace={apiWorkspace}`
in their own configured command rather than a literal package name. `SpecName`'s branded-open-string
type. Every unit test that stubs a `SpecName` value without resolving it through a real broker —
`capacity-read-broker.test.ts`, `instance-entry-layer-broker.test.ts`,
`capacity-why-render-transformer.test.ts`, `fleet-table-render-transformer.test.ts`,
`capacity-args-contract.test.ts`, and siblings — none of these call `laneSpecFindBroker`, so none of
them need to change; a sub-agent should NOT touch these files. `packages/web/playwright.config.ts`, the
fake-CLI fixtures under `packages/web/test/harnesses/claude-mock/` and
`packages/orchestrator/test-fixtures/fake-ward-bin/` — all stay exactly as they are.

## 5. Work breakdown

Ordered by dependency; grouped by package so no two pieces in the same package land at once. A
piece inside `packages/siegelense` is split into lettered steps for the same reason — still one
package, still serialized, just named so a driver can hand them to sub-agents one after another rather
than as one enormous diff.

**Piece 1 — `packages/config`.** No dependency on anything else in this list; do first.
Files: `src/contracts/dungeonmaster-config/dungeonmaster-config-contract.ts` (+ `.test.ts`) — add the
`devServer.e2e` shape from 3.1; `src/statics/config-defaults/config-defaults-statics.ts` (+ `.test.ts`)
if a default belongs there; `src/responders/install/create-config/install-create-config-responder.ts`
(+ `.test.ts`) — seed the placeholder `e2e.processes` entry from 3.6.

**Piece 2 — `packages/siegelense`, step A (the new dependency and the derive broker).** Depends on
Piece 1's contract shape.
Add `"@dungeonmaster/config": "*"` to `package.json`. New:
`src/adapters/dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter.ts` (+ proxy + test),
mirroring the orchestrator's own. New: `src/statics/lane-spec/lane-spec-convention-statics.ts` (the
`{browsered: 'stack', headless: 'api'}` map). Rewrite
`src/brokers/lane-spec/find/lane-spec-find-broker.ts` (+ `.proxy.ts` + `.test.ts`) to the async body in
3.2. New error for "e2e not configured" (3.2 step 2, 3.6/6.1).

**Piece 2 — step B (delete the fake-CLI mechanism).** Same package, after step A so the broker it edits
already compiles against the new spec shape.
Edit `src/brokers/lane/boot/lane-boot-broker.ts` (+ `.test.ts`) — remove the block at 3.4. Delete
`src/statics/fake-agent-cli/fake-agent-cli-statics.ts` (+ `.test.ts`). Delete
`src/errors/fake-agent-cli-required/` (both files). Edit
`src/contracts/lane-spec/lane-spec-contract.ts` (+ `.test.ts`) — drop the field. Edit
`src/contracts/boot-failure-marker/boot-failure-marker.stub.ts`. Delete
`src/statics/lane-spec/lane-spec-statics.ts` (+ `.test.ts`).

**Piece 2 — step C (the two remaining real callers).** Same package.
Edit `src/brokers/instance/start/instance-start-broker.ts` (+ `.proxy.ts` + `.test.ts`) — `await` the
now-async call. Edit `src/statics/capacity/capacity-statics.ts` (+ `.test.ts`) per 3.5. Edit
`test/harnesses/driver-fleet/driver-fleet.harness.ts` and
`src/flows/driver/driver-flow.integration.test.ts` — both boot a REAL lane against a literal
`'dungeonmaster-api'`/`'dungeonmaster-stack'` string; repoint them at the new convention names, and
make sure this repo's own `.dungeonmaster.json` (Piece 5) lands before these are run for real.

**Piece 2 — step D (hydration-recipes scaffold).** Same package, independent of steps A-C — can run
before or after them, just not concurrently with another siegelense step.
Edit `src/responders/install/recipes-scaffold/install-recipes-scaffold-responder.ts`
(+ `.test.ts`) per 3.6.

**Piece 3 — `packages/cli`.** Depends on Piece 1 (the config shape to read) and, for naming
consistency in its own comments, on Piece 2 step A landing first.
Edit `src/statics/playwright-config-template/playwright-config-template-statics.ts` (+ `.test.ts`) per
3.6.

**Piece 4 — `packages/orchestrator`.** Depends on Piece 2 step A (the new convention name must exist).
**Must also wait for the separate DEF-26 worktree to merge and leave this package** — the ledger
already names this ordering, and it is the same "never two sub-agents in one package at once" rule
this whole walkthrough runs by, just across two different pieces of work rather than two sub-agents in
one session.
Edit `src/statics/lane/lane-statics.ts` (+ `.test.ts`) — one literal value.

**Piece 5 — no package (docs and this repo's own config).** Independent of every piece above; safe to
run any time, including in parallel with all of them.
Delete the four `playbook/smoketest-*.md` files. Edit root `CLAUDE.md` to drop the dangling
`playbook/smoke-testing.md` line. Once Pieces 1-4 are built, hand-edit this repo's own
`.dungeonmaster.json` to the shape in 3.7 — this is the step that makes dogfooding real, and is the
right moment to actually boot a lane against it and confirm `dungeonmaster siegelense start --spec
stack` reaches this repo's own `/api/guilds`.

## 6. Decisions and corrections (2026-09-23)

The user answered section 7's questions. The driver also found one hole in section 3.4. **These override
sections 3 to 5 wherever they disagree.**

**D1. An unedited placeholder fails with a named error.** The user left this to the driver's judgment.
`InstallCreateConfigResponder` seeds the placeholder entry from 3.6. `laneSpecFindBroker` compares each
configured process against the seeded placeholder. On a match it throws a named error. That error names
`devServer.e2e.processes` in `.dungeonmaster.json` and says what to put there. The same error fires when
`devServer.e2e` is absent. A plain "command not found" from the shell is not enough: it points at npm, not
at the config field to edit. The placeholder value lives in one statics file, which both the seeding code
and the check read.

**D2. The lane names are `stack` and `api`.** The user confirmed them.

**D3. Every consumer repo is a monorepo.** This is a constraint the user sets. Nothing supports a
single-package repo. The driver documented it in `README.md` (Prerequisites) and root `CLAUDE.md`, at the
user's request. The monorepo assumption in 3.6 and in `recipeLocationStatics` is correct, not a gap.

**D4. Correction to 3.4: each configured process carries its own `env`.** As written, 3.4 makes the
CALLER'S shell supply the fake Claude and ward variables. That breaks dogfooding. The orchestrator's siege
stage starts lanes through `laneProvisionBatchBroker`, and nothing there sets those variables. So a siege
lane of this repo would boot dungeonmaster's server with the REAL `claude` binary, and spend real usage.
Decision 3 says siegelense fakes exactly what the repo's Playwright setup fakes. So the fakes belong in the
repo's own config, next to the command they apply to:

- Each entry in `devServer.e2e.processes` gains an optional `env: Record<string, string>`. Its values take
  the same placeholder tokens `lanePlaceholderSubstituteTransformer` already fills: `{apiPort}`,
  `{webPort}`, `{claudeQueueDir}`, `{wardQueueDir}` and the workspace tokens.
- A relative path in an `env` value resolves against the repo root.
- This repo's `.dungeonmaster.json` (3.7) sets `CLAUDE_CLI_PATH`, `WARD_CLI_PATH`, `FAKE_CLAUDE_QUEUE_DIR`
  and `FAKE_WARD_QUEUE_DIR` in the api process's `env`, with the same values `packages/web/playwright.config.ts`
  sets today. It also sets the port variable the server reads, from `{apiPort}`.
- This also closes the gap 3.3 notes: a process gets its per-run port through `env`, not only through
  its `command` string.
- The seeded placeholder from D1 sets a port variable through `env`, such as `"PORT": "{apiPort}"`, so a
  consumer can see the shape. This is how init "sets up the commands so each run gets its own ports".
- siegelense still knows nothing about Claude or ward. It passes through whatever `env` the config names.

**D5. This repo's Playwright config reads the same block.** 3.7 calls this optional. It is not. Two
hand-kept copies of the same commands and fakes is how the lane and the e2e run drift apart.
`packages/web/playwright.config.ts` maps `devServer.e2e.processes` into its `webServer` array, the same
way the scaffolded template does in 3.6.

**D6. Stale parts of this scroll.**
- DEF-26 is merged (`094059dc6`). No piece waits on it.
- The user deleted only `playbook/smoketest-mcp-handoff.md` and `playbook/smoketest-mcp-orchestration.md`.
  `smoketest-instances.md` and `smoketest-orchastrator.md` STAY. Piece 5 deletes no playbook file.
- The dangling `CLAUDE.md` pointer is already removed (`0fb100762`).

**D7. Build order, as dispatched.**
1. Now, in parallel: Piece 1 (`packages/config`, with D1's placeholder statics and D4's `env` field), and
   Piece 2 step D (`packages/siegelense`, the recipes scaffold).
2. After Piece 1 merges: Piece 2 steps A, B and C in one worktree, and Piece 3 (`packages/cli`).
3. After Piece 2 merges: Piece 4 (`packages/orchestrator`), then D5 (`packages/web`) and this repo's
   `.dungeonmaster.json`.

## 7. Open questions (answered in section 6)

1. **Fail loudly at init time, or at boot time?** `InstallCreateConfigResponder` seeds a placeholder
   `e2e.processes` entry per 3.6, matching how the scaffolded Playwright config already ships a
   placeholder. Should `dungeonmaster siegelense start` refuse with a distinct, named error the FIRST
   time it detects the placeholder is unedited (comparing against the literal seeded value), or is a
   plain command-not-found failure from the shell an acceptable first signal, same as Playwright's own
   placeholder gives today?
2. **What are the two convention names?** This design proposes `'stack'`/`'api'`, dropping the
   `dungeonmaster-` prefix since the names no longer describe dungeonmaster's own app. Confirm those
   two names, or a different pair — they become part of every consumer's `--spec` flag.
3. **Non-monorepo consumers.** This design, like `recipeLocationStatics` before it, assumes a
   `packages/*` layout for the hydration-recipes scaffold (3.6) and reads `devServer.e2e` off the SAME
   `.dungeonmaster.json` regardless of `framework`. For a single-package (non-`monorepo`) consumer,
   what builds `packages/hydration-recipes`, and does `packages/` even belong at that repo's root? Is
   scoping this whole design to `framework: 'monorepo'` consumers, for now, acceptable?
