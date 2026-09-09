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

**Every check runs through \`npm run ward\`** — never \`npx jest\`/\`eslint\`/\`tsc\`/\`playwright\` or \`npm test\`. Scope it to your files; see ward-discipline before a bare run.

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

**Scope ward to the job.** Given specific files, run ward on those files and nothing wider: \`npm run ward -- -- <files>\`. Run a bare \`npm run ward\` before a merge into the default branch, or when the user asks for one. Ward never emits into your source tree or your \`dist\`; a build is a separate command — see build-discipline.

**Never \`cd\` into a package.** Ward runs from the repo root; scope it with paths after \`--\`. Prefer FILE paths; a bare directory pulls in the package.

**Let it block, with \`timeout: 600000\`** (the 2-min default kills a repo-wide run). A wide run outlives even that, and the harness then backgrounds it and returns you no result — background-tasks says what to do there, and it is never "end your turn". **Never \`sleep\` on a ward run, and never \`tail\` its output file.**

**Run it ONCE per tree state, and fix on \`--uncommitted\`.** Right flags first time; never re-run the same checks hoping for a different answer. A FIX makes a new state, so re-running after one is fine — and a red found by a bare run costs another whole-repo run to confirm, where \`--uncommitted\` runs only what you touched. Iterate there to exit 0, THEN one bare run as the regression pass. **No typecheck is lost**: \`tsc --noEmit\` grades a touched package WHOLE whatever paths you pass.

**A skip on a scoped run is not a regression.** \`No tests found\` on a file-scoped run becomes \`status: 'skip'\`; full runs still fail loudly. Never reach for \`--passWithNoTests\`. \`DISCOVERY MISMATCH\` means the check type has no counterpart for those files — narrow \`--only\`, never widen scope.

**Who owns a FULL run.** An agent working directly for the user makes a full \`npm run ward\` exit 0 and owns every failure in it, including ones it did not cause. An orchestrator-dispatched role never runs the full sweep; its Operating Rules name its rung, and the dispatcher's own \`run-ward\` item is the regression pass.`,

  packages: null,

  backgroundTasks: `## Background Commands and Ending Your Turn

Applies to every long-running command, in any repo, by any agent.

**A command can outlive the Bash call that started it.** Anything slow — a whole-repo ward, a build, an install, a browser run — crosses the call's timeout, and the harness moves it to the background. The call then returns saying so, carrying NO result. Give a long command \`timeout: 600000\` up front. \`run_in_background: true\` buys nothing: it blocks for that same timeout either way.

**Your final response TERMINATES every background command you own, and no notification can follow it.** A command still running when you stop dies part-way, while your report reads clean and nothing tells you it happened.

Every still-running command is in one of two cases, and both end with it no longer running:

| Case | What you do |
|---|---|
| You need its RESULT — a ward, a build, a test run, an install | **Do not end your turn.** Stay in this turn and wait on the CONDITION: a bounded loop that returns the moment its marker or exit line appears, repeated as often as it takes. Then read the result once. |
| You are DONE with it — a dev server, a preview, a watcher, a test lane | **Kill it now**, in this turn, then stop. Leaving it up does not keep it alive past your final response; it only strands its port. |

**Wait on a condition, never on a guess.** Never \`sleep\` a fixed duration and assume it finished, never \`tail\` its output file, and never re-run it to find out whether the first one did.

**A HELPER is a different mechanic.** The \`Agent\` tool is asynchronous and its notification re-enters you, so a helper still out is not what this page governs.`,

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

  worktrees: `## Worktrees

Applies in any repo \`dungeonmaster init\` has touched.

**One tool makes a worktree: \`mcp__dungeonmaster__create-worktree({ name })\`.** It returns a path under \`worktrees/\` with \`node_modules\` hardlinked, the compiled output copied across, and every link verified to resolve inside the tree. Claude Code's own worktree command is refused by a hook naming this tool, and a hand-assembled \`git worktree add\` gives you a tree where nothing resolves — no \`node_modules\`, no binaries, so ward cannot start.

**Never recompile a native module inside a worktree.** \`node_modules\` is hardlinked, so a package's files and the main checkout's are the same bytes. Installing is safe: npm REPLACES a package directory, which breaks the link cleanly. \`npm rebuild\` is not: node-gyp writes its output through the existing path, so the build lands in the main checkout and every other worktree at once. Rebuild in the main checkout instead — through that same hardlink, every worktree already has the result.

**A worktree is NOT hermetic, and that fakes experiments.** It sits under the main checkout, so node's walk-up escapes it: move a package's compiled output aside inside a worktree and resolution keeps climbing until it finds the main checkout's copy. A typecheck that should have failed then passes, and reads back as "the premise was wrong". An experiment that turns on missing compiled output has to fence resolution to the worktree rather than trusting the directory boundary.`,

  generatedConfig: `## Generated and Gated Config

Applies in any repo \`dungeonmaster init\` has touched.

**Never hand-edit \`.claude/settings.json\`, \`.claude/settings.local.json\`, \`.mcp.json\`, or any \`.env*\` file.** The settings files are GENERATED: each dungeonmaster package's \`StartInstall\` writes and merges its own section, so a hand-edit is overwritten the next time anyone runs \`dungeonmaster init\`. All four are also gated behind a permission prompt, which stalls an automated run — and dispatching a sub-agent to edit one hits the same wall.

**To change a generated entry, change the code that generates it, then re-run \`dungeonmaster init\`.**

| Entry | Owner |
|---|---|
| hook entries — \`PreToolUse\`, \`SessionStart\`, \`SubagentStart\`, \`WorktreeCreate\` | \`@dungeonmaster/hooks\` |
| \`permissions.allow[]\` rows like \`mcp__dungeonmaster__<tool>\` | \`@dungeonmaster/mcp\` |
| the \`.mcp.json\` server entry | \`@dungeonmaster/mcp\` |
| \`worktrees/\` and its gitignore line | \`@dungeonmaster/orchestrator\` |
| anything else | the package whose \`StartInstall\` writes it |

For a gated file nothing generates — an \`.env\`, a hand-written \`.mcp.json\` — write up the cause and the exact one-line diff and ask the user to apply it. Do not reach for another tool to get around the prompt.`,
} as const;
