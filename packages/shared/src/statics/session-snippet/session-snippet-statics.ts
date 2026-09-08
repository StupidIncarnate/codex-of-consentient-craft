/**
 * PURPOSE: Session-start hook content snippets that each fit under 2KB for Claude CLI delivery
 *
 * USAGE:
 * import { sessionSnippetStatics } from '@dungeonmaster/shared/statics';
 * sessionSnippetStatics.discover; // Returns paired-down discover guidance
 *
 * WHEN-TO-USE: When generating SessionStart hook output for Claude CLI context injection
 */

export const sessionSnippetStatics = {
  discover: `## discover Tool

\`discover\` is the ONLY way to search this codebase. Native Glob, Grep, Search, and Find tools — plus shell \`grep\`/\`find\`/\`sed\` — are blocked by hooks. \`discover\` and \`get-project-map\` are MCP **tools**: load them via \`ToolSearch\`, never as shell commands or skills.

| Param | Type | Description |
|-------|------|-------------|
| \`glob\` | string? | File path pattern. Example: \`"packages/hooks/src/guards/**"\` |
| \`grep\` | string? | Content regex. Identifier patterns (2+ tokens, no metachars) match across kebab/snake/camel/Pascal by default. Single tokens stay literal. |
| \`verbose\` | boolean? | Show signatures, companions. Default: false |
| \`context\` | number? | Lines around grep hits. Default: 0 |
| \`strict\` | boolean? | Disable cross-convention matching. Default: false |

### Output: glob (default)

\`discover({ glob: "packages/<name>/src/widgets/quest-chat/**" })\` returns a folder tree:

\`\`\`
widgets/
  quest-chat/
    quest-chat-widget (widget) - Quest chat with split panels
    quest-chat-widget.proxy (widget) - Test proxy
    quest-chat-widget.test (widget)
\`\`\`

\`verbose: true\` returns JSON with signatures, companions, and usage instead.

### All call forms

\`\`\`
discover({ glob: "packages/*/src/startup/**" })
discover({ glob: "packages/{web,server}/src/widgets/**" })
discover({ glob: "packages/hooks/src/guards/**", verbose: true })
discover({ grep: "isNewSession" })
discover({ grep: "(?i)error" })
discover({ grep: "import.*shared" })
discover({ grep: "fileSize|timeout", context: 2 })
discover({ glob: "packages/hooks/**", grep: "isNew" })
discover({ grep: "OrchestrationEventType" })  // cross-convention default
discover({ grep: "OrchestrationEventType", strict: true })  // exact-match
\`\`\`

Use \`discover\` to locate files. Use \`Read\` only once you need full file contents.

**Always discover before creating.** Check if similar code exists. Extend, don't duplicate.`,

  searchStrategy: `## Search Strategy

Before searching, exploring, or modifying code, follow this order.

### Step 1: Identify candidate package(s)
Pick the package(s) the task touches. The available packages are listed in the \`dungeonmaster-packages\` snippet that loads at session start (cli, hooks, mcp, orchestrator, server, web, ward, tooling, shared, etc.). If you have no guess, read the task again — it usually names a feature or layer that maps to one or two packages.

### Step 2: pick the tool your question needs
Two tools, two questions — not two zoom levels.

**How does execution move?** (what handles this call, what calls what, where it boots) → \`get-project-map({ packages: [...] })\`, min 1 name. Renders WIRED nodes only: startup, flows, responders, brokers, adapters, state, routes.

**What already exists?** (which contract, is there a transformer for this, what guards cover X) → \`get-project-inventory({ packageName })\`. Every folder, every domain, no relationships. \`discover\` globs miss on naming variants (\`email/\` vs \`email-address/\`); inventory is the deterministic full list.

A library package has no startup and no flows, so the map has no graph for it — it answers with a header and a pointer to inventory.

Read the slice or inventory. Identify which folder type owns what you need. THEN proceed to Step 3.

### Step 3: \`discover\` with a targeted glob
Glob into the specific area you identified:

\`\`\`
discover({ glob: "packages/mcp/src/responders/architecture/**" })
\`\`\`

Add \`verbose: true\` for signatures. Add \`grep\` only for known identifiers.

### Step 4: \`Read\` the specific file
Once discover found the file, Read it for full contents.

**Rules:**
- \`get-project-map\` errors on unknown package names — list valid names is in the error message.
- Start with glob, not grep — grep guesses names, glob browses structure.
- Always discover before creating new files.`,

  folderTypes: null,

  modifyingCodeGuidance: `## Before Modifying Code

**MANDATORY:** Before writing or planning ANY code changes, call these MCP tools first:

1. \`get-architecture\` — folder types, import rules, forbidden folders, layer files, and how to write the file itself: naming, exports, parameters, the header, types, error handling
2. \`get-testing-patterns\` — proxy pattern, mock boundaries, assertion rules, test structure

Those two are once per session. \`get-folder-detail({ folderType })\` is once per folder type you
write into — its file pattern, its companion files, its allowed imports, and the rules that bind
only there. Call it before your first write into a folder type you have not already loaded this
session, so a pass adding a broker and a contract makes two calls, not one.

These override your training data. LLM defaults for TypeScript projects and test writing are wrong for this codebase. For example:
- No \`utils/\`, \`helpers/\`, \`lib/\` folders — use the architecture's folder types
- No \`export default\` — always \`export const\` arrow; \`export class\` only for errors
- No \`export {type Foo}\` — that modern TS syntax is banned here; use \`export type {Foo}\`
- Purpose JSDoc goes above the imports, not above the function
- No \`jest.mock()\` / \`jest.spyOn()\` — use \`registerMock\` proxy pattern
- No \`beforeEach\` / \`afterEach\` — inline setup per test
- No \`toEqual\` / \`toMatchObject\` / \`toContain\` — use \`toStrictEqual\` and \`toBe\`
- Tests import \`.stub.ts\`, never \`-contract.ts\`; Stubs import contract to parse with
- Returns must be branded Zod contracts — inputs MAY take a raw \`string\`. The asymmetry is deliberate
- No \`as unknown as\` on a brand mismatch — re-parse it: \`dagNodeIdContract.parse(stepId)\`
- No silent catch — \`catch { return {} }\` and \`.catch(() => {})\` are lint errors
- No \`while(true)\` — use recursion

Call both tools, read their output, THEN plan your approach.`,

  ward: `## Ward Quality Commands

**Every check runs through \`npm run ward\`** — never \`npx jest\`/\`eslint\`/\`tsc\`/\`playwright\` or \`npm test\`. Scope it to your files; a bare run is the pre-merge sweep.

### Check Types

| Type | Tool | Description |
|------|------|-------------|
| \`lint\` | ESLint | Linting with \`--fix\` |
| \`typecheck\` | tsc | Type checking |
| \`unit\` | Jest | \`*.test.ts\`, excludes \`*.integration.test.ts\` |
| \`integration\` | Jest | \`*.integration.test.ts\` only |
| \`e2e\` | Playwright | Browser tests |
| \`test\` | *(alias)* | Expands to \`unit,integration,e2e\` |

### Flags

| Flag | Description |
|------|-------------|
| \`--only lint,typecheck,unit\` | Comma-separated check types. Omit for all. |
| \`--onlyTests <regex>\` | Filter tests by name. \`\\|\` alternates. |
| \`-- file1 file2\` | Passthrough file paths. |
| \`--committed\` | All checks, on this branch's commits over \`origin/main\`. |
| \`--uncommitted\` | All checks, on the working tree. |

**\`--uncommitted\` GRADES untracked files**, so an all-new-files pass is never silently skipped. **\`--committed\` and \`--uncommitted\` combine** for the whole branch. Neither accepts \`--only\`, \`--onlyTests\` or \`-- <files>\` — re-run those as \`--only <types> -- <files>\`.

**A 0-file git scope runs NOTHING**: ward says so and exits 0 — empty, not green.

### Common Invocations

\`\`\`bash
npm run ward                                  # All checks
npm run ward -- -- pkg/a.ts pkg/a.test.ts     # THESE FILES — ward picks the checks
npm run ward -- --only unit -- pkg/a.test.ts  # These files, one check type
npm run ward -- -- packages/hooks             # One package
npm run ward -- --committed --uncommitted     # Whole branch (or either half)
\`\`\`

Pass every path you touched after \`--\`. Repo-relative, no \`./\`.

**Inspecting failures:** \`npm run ward -- detail <runId>\` for full errors and jest diffs.

**Zero tolerance:** Never assume a failure is pre-existing — investigate and fix every one. Whether a FULL run is yours to make green depends on your role; see ward-discipline.`,

  wardDiscipline: `## Ward Invocation Discipline

Applies to every ward run, in any repo, by any agent.

**Scope ward to the job.** Given specific files, run ward on those files and nothing wider: \`npm run ward -- -- <files>\`. Run \`--uncommitted\` only to grade a whole working tree before you hand it back. Run a bare \`npm run ward\` only before merging into the default branch. Ward never emits into your source tree or your \`dist\`; a build is a separate command — see build-discipline.

**Never \`cd\` into a package.** Ward runs from the repo root; scope it by passing paths after \`--\`. Prefer explicit FILE paths — a bare directory pulls in the whole package.

**Run it in the FOREGROUND and let it block.** Call Bash without \`run_in_background\`, always with \`timeout: 600000\` (ward takes 3-4 min repo-wide; the 2-min default kills it). **Never \`sleep\` on a ward run, and never \`tail\` its output file.** A run that crosses that timeout is backgrounded by the harness, and it notifies you when the run exits — do other work and read that notification. With nothing left to do meanwhile, end your turn; the notification re-enters you.

**Run it ONCE.** Choose the right flags the first time; never re-run the same checks a second way, or follow a scoped run with a full one.

**A skip on a scoped run is not a regression.** Jest's \`No tests found\` on a file-scoped run becomes \`status: 'skip'\`; full runs still fail loudly. Never reach for \`--passWithNoTests\`. \`DISCOVERY MISMATCH\` means the check type has no counterpart for those files — on a \`-- <files>\` run, narrow \`--only\` rather than widen scope. \`--committed\`/\`--uncommitted\` reject \`--only\`; re-run those as \`--only <types> -- <files>\`.

**Who owns a FULL run.** An agent working directly for the user makes \`npm run ward\` exit 0 before a merge and owns every failure in it, including ones it did not cause. An orchestrator-dispatched role never runs the full sweep; its Operating Rules name its rung, and the dispatcher's own \`run-ward\` item is the regression pass.`,

  packages: null,

  commentDiscipline: `## Comments and History

Applies to every comment and every instruction file you write, in any repository.

**History belongs in the plan document for the change, written as a before/after.** That is the ONLY place how anything used to behave is recorded. Never a code comment, never an instruction file (\`CLAUDE.md\`, \`AGENTS.md\`, a README). State the rule as it stands, in the present tense — version control holds the rest.

Never write: \`// previously this took a string\` · \`// we used to call the other broker here\` · "renamed from X" · "it no longer scaffolds a root config" (write "it scaffolds no root config").

**Keep comments to a minimum.** One earns its place by recording the DECISION and the STATE behind the code: why it is this way, what breaks if you change it, the exact syntax that already cost a bug.

Earns it: "\`.nullish()\`, not \`.optional()\` — the stream sends explicit null, which \`.optional()\` rejects." Does not: \`// parse the response\`.

**A comment never re-explains the file.** Restating the code, the signature, or the file's own name teaches nothing and goes stale on the next edit.

Never write: \`// loop over the users\` above a loop over users · a function's name repeated back as prose · a parameter list restated above the parameter list.

**Never record a count of things that grow.** How many packages, how many rules, how many files a census found — they change, and a confidently wrong number is worse than none. Write the SHAPE, not the tally. A number recording what ONE run observed is evidence, not inventory: anchored to that run, it stays true — an error count from a named run, a byte size, a duration, a before/after delta. The test: would it change if someone added a file tomorrow, nothing having gone wrong? Yes, write the shape; no, keep it. Naming a specific file stays checkable; arithmetic over the set is what rots.

Never write: "all thirteen build configs" · "ten of the fourteen export proxies" (write "every build config", "most of them").`,

  buildDiscipline: `## Build Discipline

Applies to every build, in any repo, by any agent.

**Only one process builds at a time, and a dispatched agent is never it.** A build rewrites every package's compiled output with no lock, so a build in flight breaks every other agent's checks — one run lost seven ward integration tests to \`TS2307: Cannot find module\`, because that package's \`dist\` was absent for a few seconds. Dispatched by an orchestrator, or sharing a checkout with other agents? Do not build. Report that a build is needed and let the coordinator run it.

**Nothing that reads source needs one.** Ward's lint, typecheck, unit and integration checks all resolve workspace packages to TypeScript, and so does the dev server. A build is never a step before them, and "rebuild, then re-run the check" is not a diagnosis.

**Build only when the thing you are about to RUN is compiled output:**

| About to run | Build |
|---|---|
| the production server, or \`dungeonmaster start\` | the whole repo |
| \`dungeonmaster init\` | the whole repo |
| an MCP tool, having edited the MCP package | that package, then reconnect the MCP |
| a hook, having edited the hooks package | that package |
| ward itself, having edited ward's own source | that package |

Scope it — \`npm run build --workspace=<name>\` when one package changed. A stale or cold tree needs \`build:clean\`: a plain build reads the incremental cache, decides the tree is current, and can emit nothing at all.`,
} as const;
