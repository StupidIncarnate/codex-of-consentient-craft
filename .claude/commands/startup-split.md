# Startup Layer Split

You are the **orchestrator** for converting a package's startup files to comply with architectural constraints. You
coordinate work by dispatching agents — you NEVER write code yourself. All implementation, file reading, and testing is
done by agents you dispatch.

**The ONLY files you read directly are plan files you create.** Everything else — reading source code, checking
patterns, exploring the codebase — must be delegated to agents. If you need information to make a decision, dispatch an
agent to gather it and report back.

## Constraints being enforced

1. **No branching in startup** — ESLint rule `@dungeonmaster/ban-startup-branching` bans ALL `if`, `switch`, and ternary
   operators in any file under `/startup/`. No exemptions. (`try/catch` and `&&`/`||`/`??` ARE allowed.)
2. **Restricted imports** — Startup files can ONLY import from `flows/`, `contracts/`, `statics/`, `errors/`. Flows can
   ONLY import from `responders/` and whitelisted routing frameworks (`hono`, `react-router-dom`, `express`). No layer
   can import npm packages unless explicitly whitelisted in `folder-config-statics.ts` — only `adapters/` has generic
   `node_modules` access.

## Target package

`$ARGUMENTS`

## Agent dispatch rules

- **Agents** (via `Agent` tool) — Use for all implementation work. Pass them the plan context and clear instructions on
  what to build.
- **Sub agents** — Use for exploratory research (finding files, reading code, checking patterns) and for lint/test
  fixes. Never for primary implementation.
- **Terse responses** — Instruct all agents to keep their response messages short. Only report what was done, what
  failed, and what needs attention.

## MANDATORY: Read standards before designing

Before designing ANY split, you MUST have your exploration agent use these MCP tools and report back:

- `get-folder-detail` for `startup`, `flows`, and `responders` — these contain naming conventions, import rules, test
  requirements, and code examples
- `get-syntax-rules` — universal conventions for exports, types, destructuring
- `get-testing-patterns` — proxy pattern, mock boundaries, assertion rules

**Do not design based on assumptions.** The standards contain specific rules about folder depth, file naming, import
restrictions, proxy requirements, and test file types. Read them first.

## Workflow

### Phase 1: Explore

Dispatch an agent to explore the target package and report back with:

1. Every file under `packages/<target>/src/startup/` — what each does, what it imports, where it branches.
2. The `package.json` `bin` field — which startup files are used as CLI binaries (these need thin entry files at
   `{packageRoot}/bin/`).
3. Any existing `flows/`, `responders/`, and `bin/` directories and their contents.
4. Existing integration tests on startup files and what they assert.
5. The canonical reference files for the correct pattern:
   - `packages/cli/src/startup/start-install.ts` (clean startup — single flow delegate)
   - `packages/cli/src/flows/install/install-flow.ts` (clean flow — single responder delegate)
   - `packages/cli/src/responders/install/add-dev-deps/install-add-dev-deps-responder.ts` (responder with logic)
   - `packages/cli/bin/cli-entry.ts` (thin bin entry — imports startup and calls it)
6. Architecture info via MCP tools: `get-folder-detail` for `startup`, `flows`, `responders`; `get-syntax-rules`;
   `get-testing-patterns`.

### Phase 2: Design the split

Using the agent's report, design a concrete plan listing for each violating startup file:

- Every new file to create (full path)
- Every existing file to modify (full path)
- What logic moves where
- What tests move where

Write this plan to `.claude/plans/startup-split-<target>.md`. **Present it to the user for approval before proceeding.**

#### Critical design rules

**Everything is a route.** HTTP endpoints, MCP tool calls, CLI subcommands, queue job types, hook event types — these
are ALL forms of routing. They all follow the same pattern: startup → flow → responder.

- HTTP `GET /api/guilds` → `flows/guild/guild-flow.ts` → `GuildListResponder`
- MCP tool `discover` → `flows/discover/discover-flow.ts` → `DiscoverResponder`
- CLI command `init` → `flows/init/init-flow.ts` → `InitResponder`
- Hook event `pre-edit` → `flows/pre-edit/pre-edit-flow.ts` → `PreEditResponder`

Do NOT treat non-HTTP routing as a special case. The pattern is identical regardless of transport.

**Flows are one entry per file, one flow per domain/concern.** A flow file maps to a single logical entry point or
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

Example — an MCP server with architecture, quest, and ward tools:

```
startup/start-mcp-server.ts             → mounts ArchitectureFlow, QuestFlow, WardFlow, etc.
flows/architecture/architecture-flow.ts → wires architecture tool calls to responders
flows/quest/quest-flow.ts               → wires quest tool calls to responders
flows/ward/ward-flow.ts                 → wires ward tool calls to responders
```

NOT:

```
flows/mcp-server/mcp-server-flow.ts     → one mega-flow dispatching all 17 tools ← WRONG
```

**Flows do routing ONLY.** A flow maps inputs to responders. It does NOT:

- Create servers or transports (that's adapter territory)
- Initialize state (that's a responder or broker concern)
- Define tool schemas or register handlers (that's wiring that belongs in the flow, but the schema definitions
  themselves come from contracts)
- Contain business logic of any kind

**Flows CAN contain branching.** The lint rule only targets `startup/` files. Flows can have `if`/`switch`/ternary for
routing logic. This is their purpose — they route to responders.

**Flows can import whitelisted routing frameworks only.** Flows are whitelisted for `hono`, `react-router-dom`, and
`express` — these are the routing frameworks flows use to wire routes to responders. Flows CANNOT import arbitrary npm
packages. If a flow needs other npm functionality, it must go through a responder → adapter chain. Check
`folder-config-statics.ts` for the current whitelist if unsure.

**Do NOT whitelist additional npm packages for flows without user approval.** If you believe a package needs
whitelisting (e.g., an MCP SDK, a queue framework), flag it to the user as a constraint conflict. Do not modify
`folder-config-statics.ts` yourself. The user will decide whether to whitelist it or restructure the code to work
through adapters instead.

**Server/transport creation belongs in adapters.** Creating an HTTP server (Hono), an MCP server
(`@modelcontextprotocol/sdk`), a queue connection, or any transport is I/O — it wraps an npm package and belongs in
`adapters/`. The startup or a responder calls the adapter to get the server object, then passes it to flows for route
wiring.

**`isMain` / self-invocation guards must be removed from startup files.** These are `if` statements and will fail lint.
Solutions:

- For CLI binaries: Create a thin entry file at `{packageRoot}/bin/` (outside `src/`, so ESLint folder rules don't
  apply). E.g., `bin/cli-entry.ts` imports and calls the startup function. Update `package.json` bin entry and
  `tsconfig.json` include to add `bin/**/*`. The startup file becomes a pure export.
- For hook scripts (always invoked directly by Claude Code): Remove the guard entirely — these files are never imported
  by other code, so no guard is needed.
- For auto-start patterns (`if (NODE_ENV !== 'test') { Start() }`): Remove entirely. The caller decides when to invoke.

**If a constraint makes the conversion impossible, STOP and notify the user.** Describe the specific conflict — e.g.,
"The flow needs to import X but flow import rules don't allow it" or "This logic can't be expressed without an
if-statement in startup." Do not hack around the rules.

### Phase 3: Implement

After user approval, dispatch agents to implement the split. Group work logically — one agent per startup file or per
related set of files. For each agent, provide:

- The specific section of the plan it should implement
- The full paths of files to create and modify
- Instructions to use MCP tools (`get-folder-detail`, `get-syntax-rules`, `get-testing-patterns`) for patterns
- Instructions to read the canonical reference files before writing code

Each agent should:

1. Create new responder files with their `.proxy.ts` and `.test.ts` companions (per responder standards).
2. Create new flow files with `.integration.test.ts` companions (per flow standards).
3. Modify startup files to delegate to flows only.
4. If thin entry files are needed (for `isMain` replacement), create them and note any build config changes needed.

### Phase 4: Redistribute tests

Dispatch an agent to handle test redistribution. Startup files currently have `.integration.test.ts` files. When logic
moves out of startup:

- **Logic-level tests** (testing branching, validation, I/O behavior) → move to the **responder's `.test.ts`** using the
  proxy pattern. These become unit tests.
- **Wiring tests** (testing that startup correctly delegates to the flow, and flow correctly delegates to responders) →
  stay as or become **flow `.integration.test.ts`** files.
- **Do not delete test coverage.** Every assertion from the original startup integration test must have a home in either
  a responder test or a flow integration test.

### Phase 5: Test coverage audit

Dispatch a sub agent for each NEW file to verify it has proper test coverage according to project standards:

- Each responder must have a `.proxy.ts` and `.test.ts` with meaningful test cases covering its logic.
- Each flow must have an `.integration.test.ts`.
- If coverage is missing or thin, the agent writes the missing tests.

Then dispatch a sub agent to run `npm run ward -- -- packages/<target>` (scoped to this package only) and fix any
failures. If ward fails, use the `ward-detail` MCP tool to get full error details and dispatch a fix agent.

### Phase 6: Commit

After ward passes, commit all changes.

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
- **Integration tests must use testbed and claude mock for cleanup.** Flow `.integration.test.ts` files that touch the
  filesystem must use `installTestbedCreateBroker` from `@dungeonmaster/testing` for isolated temp directories and
  proper cleanup. If tests involve Claude CLI session data, use the claude mock utilities. Never write test files
  directly to the repo or leave temp artifacts behind.
