# Gateway build: shared brief for every agent

Read this whole file before doing anything. Your own prompt names your task; this file holds the rules every task shares.

## Where you work

- **Worktree:** `/home/brutus-home/projects/codex-of-consentient-craft/worktrees/gateway-pivot`. Every file you read or write is in this tree. Never edit the main checkout at `/home/brutus-home/projects/codex-of-consentient-craft` itself.
- **Scratch files** go in `<worktree>/tmp/`. Never `~/tmp`, never `/tmp`.
- **Scan data** from the design doc is copied into `<worktree>/tmp/adapters-fresh/`. `adapters.json` lists every adapter with its outside calls, shape, try/catch and caller counts. `spawns.json` lists every process start. `globals.json` lists platform-global uses. Use them as a starting map, then open the real files.

## What we are building

Read `scrolls/adapters-to-one-place.md`. It is the agreed design. The user changed or clarified these points after it was written, and **these override the doc:**

1. **Flat layout, no folder types inside the gateway.** Each subpath is a folder named exactly after the outside thing: `packages/node/fs/`, `packages/npm/@playwright/test/`. Wrapper files sit directly in that folder with a colocated `.test.ts` and `.proxy.ts`. The folder's `index.ts` is the subpath entry.
2. **Names.** A wrapper keeps the outside function's own name when it keeps the same meaning and a compatible argument shape, so `readFile` from `@dungeonmaster/node/fs` is always OUR guarded version. When the arguments or the meaning change, the wrapper gets a new, descriptive name, such as `readFileIfExists` or `readJsonFile`.
3. **Curated modules expose no raw functions.** `@dungeonmaster/node/fs` never re-exports Node's raw `readFile`. Everything that touches the outside world on the host is wrapped: Node `fs`, `child_process`, `net`, `readline`, and the browser's `fetch`, `localStorage`, `WebSocket`. Every `@dungeonmaster/bin` module is curated.
4. **Pass-throughs for every outside npm package our code imports today.** A pass-through is `export * from 'pkg'`, plus `export { default } from 'pkg'` when the package has a default export. A package that needs setup gets wrapped, not passed through. For example, testing-library always needs app setup.
5. **What moves into the gateway:** every adapter that directly touches an outside thing, meaning an npm package, a Node module, a platform global, or a spawned program. Its handling logic moves with it. **What stays an adapter:** an adapter that touches no outside thing directly, such as `packages/siegelense/src/adapters/dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter.ts`. We record those in `scrolls/gateway-build/stays-as-adapter.md`. We never put a note about them in code comments.
6. **Do not move code.** We write NEW files in the gateway. Existing adapters and their callers stay untouched until the orchestrator starts a consumption phase.
7. **No contracts for outside packages.** Gateway wrappers take and return plain values, or the outside package's own types, which the gateway re-exports. They never import zod contracts from our packages.

## Package and subpath naming

| Package | Folder | Holds |
|---|---|---|
| `@dungeonmaster/npm` | `packages/npm` | third-party npm packages |
| `@dungeonmaster/node` | `packages/node` | Node modules and Node globals |
| `@dungeonmaster/browser` | `packages/browser` | browser globals and browser APIs |
| `@dungeonmaster/bin` | `packages/bin` | programs we spawn: git, npm, the Claude CLI, lsof, kill |

- **Subpath equals the exact import specifier**, with any `node:` prefix dropped. So `fs/promises` becomes `@dungeonmaster/node/fs/promises`, and `react-dom/client` becomes `@dungeonmaster/npm/react-dom/client`. The mapping from a raw import to its gateway path must stay mechanical, because a lint rule and a migration script will rely on it.
- **A global's subpath is the global's exact name:** `@dungeonmaster/node/process`, `@dungeonmaster/node/setTimeout`, `@dungeonmaster/browser/localStorage`.
- **No root `.` export** in any gateway package. That would be a barrel.
- **Folders mirror subpaths exactly.** TypeScript here resolves with `moduleResolution: node` (node10), which ignores `exports` and looks for real folders.
- **Proxies for callers** are exported through a `./testing` subpath of each gateway package.

## Rules that bind every agent

1. **Read the standards first.** Call the MCP tools `get-architecture` and `get-testing-patterns` before writing any code. Load them with `ToolSearch` (`select:mcp__dungeonmaster__get-architecture,mcp__dungeonmaster__get-testing-patterns`). Their adapter sections are out of date: the gateway replaces adapters. Everything else in them applies: the file header, `export const` arrows, no `export default`, `registerMock` proxies, no `jest.mock`, no `beforeEach`, `toStrictEqual`, no silent catch, recursion instead of `while (true)`.
2. **Never disable a lint rule.** No `eslint-disable` comments, no turning a rule off in config, no `// @ts-ignore`, no `as unknown as`. If a rule blocks correct gateway code, stop and report the rule name, the file and the exact error. The lint phase decides how to adjust it.
3. **Never build.** No `npm run build`, no `tsc` emit. The orchestrator is the only one who builds. Ward's lint, typecheck and unit checks read source and need no build.
4. **Never commit, stash, branch or reset.** The orchestrator commits between phases.
5. **Run ward scoped to your files**, from the worktree root, with `timeout: 600000`: `npm run ward -- -- <your files>`. Never `cd` into a package. Never run a bare `npm run ward`.
   **Nobody knows ward's state on this tree.** It may have failures that predate this work. Fix every failure in files you wrote. For a failure in a file you did not touch, do not chase it: report the check, the file and the message, and move on.
6. **Stay in your lane.** Touch only the files and folders your prompt names. Another agent may be working in the next folder at the same moment.
7. **Search with the MCP tools** (`get-project-map`, `get-project-inventory`, `discover`) or a `python3` one-liner. Shell `grep`, `find` and `rg` are blocked by hooks.
8. **Sad paths are part of the job.** Missing file, permission denied, a directory where a file was expected, invalid JSON, empty output, a process that exits non-zero or never starts, a network refusal, a timeout. When an adapter we are replacing skips one of these, the gateway version handles it and a test proves it.
9. **Tests.** Every wrapper gets a `.test.ts` that covers its handling logic and its sad paths, and a `.proxy.ts`. Every pass-through gets a test that proves its exports match the package's own exports.
10. **Comments** follow the comment discipline in your session context: record the decision and the reason, never history, never a count of things that grow.

## How you report back

Use the "Handing a Find Back" format from your session context: ANSWER first, then EVIDENCE with `path:line` pointers. Then list, as separate short lists:

- files you created or changed
- the ward command you ran and its result, quoted
- lint rules that blocked correct code: rule name, file, exact message
- anything you could not finish, and why

Keep the report short. The orchestrator reads files itself when it needs detail.
