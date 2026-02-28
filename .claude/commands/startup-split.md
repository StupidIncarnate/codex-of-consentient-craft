# Startup Layer Split

You are converting a package's startup files to comply with two architectural constraints:

1. **No branching in startup** — ESLint rule `@dungeonmaster/ban-startup-branching` bans ALL `if`, `switch`, and ternary
   operators in any file under `/startup/`. No exemptions. (`try/catch` and `&&`/`||`/`??` ARE allowed.)
2. **Restricted imports** — Startup files can ONLY import from `flows/`, `contracts/`, `statics/`, `errors/`. Flows can
   ONLY import from `responders/` and whitelisted routing frameworks (`hono`, `react-router-dom`, `express`). No layer
   can import npm packages unless explicitly whitelisted in `folder-config-statics.ts` — only `adapters/` has generic
   `node_modules` access.

## Target package

`$ARGUMENTS`

## Your workflow

### Phase 1: Explore and plan

1. Use MCP tools to get architecture, folder details for `startup`, `flows`, and `responders`, and syntax rules.
2. Read every file under `packages/<target>/src/startup/` — understand what each does, what it imports, and where it
   branches.
3. Read any existing `flows/` and `responders/` directories in the package.
4. Read the canonical reference files for the correct pattern:
    - `packages/cli/src/startup/start-install.ts` (clean startup — single flow delegate)
    - `packages/cli/src/flows/install/install-flow.ts` (clean flow — single responder delegate)
    - `packages/cli/src/responders/install/add-dev-deps/install-add-dev-deps-responder.ts` (responder with logic)
5. Check for existing integration tests on startup files — their test cases will need to be redistributed.

### Phase 2: Design the split

For each startup file that violates, produce a concrete plan listing:

- Every new file to create (full path)
- Every existing file to modify (full path)
- What logic moves where
- What tests move where

**Present this plan to the user for approval before writing any code.**

#### Critical design rules

**Flows are one entry per file, one flow per domain/concern.** A flow file should map to a single logical entry point or
domain. If you find yourself putting multiple unrelated routes or a large switch/if-chain in one flow, split into
multiple flows. The startup mounts multiple flows, each handling its own concern.

Example — a server with guild, quest, and session routes:

```
startup/start-server.ts        → mounts GuildFlow, QuestFlow, SessionFlow, etc.
flows/guild/guild-flow.ts      → wires guild routes to guild responders
flows/quest/quest-flow.ts      → wires quest routes to quest responders
flows/session/session-flow.ts  → wires session routes to session responders
```

NOT:

```
flows/server/server-flow.ts    → one mega-flow with all 18 routes ← WRONG
```

**Flows CAN contain branching.** The lint rule only targets `startup/` files. Flows can have `if`/`switch`/ternary for
routing logic. This is their purpose — they route to responders.

**Flows can import whitelisted routing frameworks only.** Flows are whitelisted for `hono`, `react-router-dom`, and
`express` — these are the routing frameworks flows use to wire routes to responders. Flows CANNOT import arbitrary npm
packages. If a flow needs other npm functionality, it must go through a responder → adapter chain. Check
`folder-config-statics.ts` for the current whitelist if unsure.

**`isMain` / self-invocation guards must be removed from startup files.** These are `if` statements and will fail lint.
Solutions:

- For CLI binaries: Create a thin entry file (e.g., `src/bin/cli-entry.ts`) that imports and calls the startup function.
  Update the build config to bundle the entry file instead. The startup file becomes a pure export.
- For hook scripts (always invoked directly by Claude Code): Remove the guard entirely — these files are never imported
  by other code, so no guard is needed.
- For auto-start patterns (`if (NODE_ENV !== 'test') { Start() }`): Remove entirely. The caller decides when to invoke.

**If a constraint makes the conversion impossible, STOP and notify the user.** Describe the specific conflict — e.g., "
The flow needs to import X but flow import rules don't allow it" or "This logic can't be expressed without an
if-statement in startup." Do not hack around the rules.

### Phase 3: Implement

After user approval, implement the split:

1. Create new responder files with their `.proxy.ts` and `.test.ts` companions (per responder standards).
2. Create new flow files with `.integration.test.ts` companions (per flow standards).
3. Modify startup files to delegate to flows only.
4. If thin entry files are needed (for `isMain` replacement), create them and note any build config changes needed.

### Phase 4: Redistribute tests

Startup files currently have `.integration.test.ts` files. When logic moves out of startup:

- **Logic-level tests** (testing branching, validation, I/O behavior) → move to the **responder's `.test.ts`** using the
  proxy pattern. These become unit tests.
- **Wiring tests** (testing that startup correctly delegates to the flow, and flow correctly delegates to responders) →
  stay as or become **flow `.integration.test.ts`** files.
- **Do not delete test coverage.** Every assertion from the original startup integration test must have a home in either
  a responder test or a flow integration test.

### Phase 5: Test coverage audit

After all files are created and tests redistributed, dispatch sub agents to:

1. For each NEW responder file: verify it has a `.proxy.ts` and `.test.ts` with meaningful test cases covering its
   logic. Use `get-testing-patterns` MCP tool for the proxy pattern. If test coverage is missing or thin, write the
   missing tests.
2. For each NEW flow file: verify it has an `.integration.test.ts`. If missing, create one.
3. Run `npm run ward` to verify lint + typecheck + tests all pass. Fix any failures.

## Additional callouts

- **Use `discover` MCP tool first** to check if similar flows/responders already exist in the package before creating
  new ones. Never duplicate existing code.
- **Responder folder depth is 2** (`responders/[domain]/[action]/`). Flow folder depth is 1 (`flows/[domain]/`). Do not
  nest deeper.
- **Entry file naming matters for cross-folder imports.** The responder filename must match its folder path (e.g.,
  `responders/guild/list/guild-list-responder.ts`). Layer files use `-layer-` infix and are internal only.
- **Don't over-decompose.** If a startup file's logic is trivial (< 50 lines, one concern), a single flow + single
  responder is enough. Don't create layers or multiple responders for simple cases.
- **Startup files at folder depth 0.** Startup files are flat in `startup/` — no subfolders.
- **Watch for circular dependencies.** When moving logic from startup to responders, ensure the responder doesn't end up
  importing something that imports the startup.
- **The startup file keeps its name.** `start-server.ts` stays `start-server.ts` — only its contents change. The
  exported function signature should remain the same to avoid breaking callers.
- **Branded types only.** No raw `string`/`number` in function signatures. Use contracts.
- **PURPOSE/USAGE comments** are required on all new implementation files.
- **`export const` arrow functions** for all exports. No `export default`, no `function` declarations.
