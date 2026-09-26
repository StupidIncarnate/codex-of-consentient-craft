# Gateway lint measurements

Measured 2026-09-26 on this branch (`worktrees/gateway-pivot`), with all six gateway lint rules
wired live in `configDungeonmasterBroker` — the three gateway shape rules
(`gateway-import-boundary`, `gateway-colocation`, `gateway-layout`) in the gateway config block,
and the three caller-facing rules (`raw-import-ban`, `platform-globals-ban`,
`bin-program-spawn-ban`) in the shared `dungeonmasterCustomRules` object (main + test blocks).
Every count below came from a real `npm run ward -- --only lint -- packages/<pkg>/src` run on
this tree, read back through `npm run ward -- detail <runId>` — never estimated. Each run covers
implementation and test files together: ward's file-scoped lint walks every `.ts` under `src/`,
`.test.ts` included, in one pass.

## Gateway packages (`bin`, `browser`, `node`, `npm`) — the shape rules

`npm run ward -- --only lint,typecheck,unit -- packages/node/src packages/npm/src
packages/browser/src packages/bin/src` — **PASS, 605 files, 0 failed** (lint), plus typecheck and
unit both green across the same four packages. The three gateway shape rules fire zero violations
on the gateway itself today. One real violation surfaced during this measurement and was fixed
(not deferred) because it landed in a file this same branch's Task 3 had just written:
`packages/node/src/process/index.ts` mixed six `export const {x} = process` global captures with
real re-exports, which `gateway-colocation`'s purity check does not recognize (it accepts a
destructure or member capture off `globalThis` only, not off `process`) — split each into its own
`stdout.ts`/`stderr.ts`/`argv.ts`/`pid.ts`/`platform.ts`/`exec-path.ts` wrapper file with a
colocated `.test.ts`/`.proxy.ts`, re-exported from `index.ts`.

## Non-gateway packages — the three caller-facing rules

One `npm run ward -- --only lint -- packages/<pkg>/src` run per package. `bin`, `browser`, `node`,
`npm` are the gateway itself and are excluded from this table; `web` is included as a caller like
any other package.

| Package | raw-import-ban | platform-globals-ban | bin-program-spawn-ban |
|---|---|---|---|
| cli | 38 | 36 | 0 |
| config | 20 | 0 | 0 |
| eslint-plugin | 68 | 2 | 0 |
| hooks | 105 | 106 | 0 |
| hydration | 53 | 2 | 0 |
| hydration-recipes | 51 | 16 | 0 |
| local-eslint | 0 | 0 | 0 |
| mcp | 119 | 41 | 0 |
| orchestrator | 218 | 484 | 2 |
| server | 107 | 114 | 0 |
| session-forensics | 21 | 21 | 0 |
| shared | 316 | 47 | 0 |
| siegelense | 324 | 551 | 1 |
| testing | 106 | 131 | 0 |
| tooling | 19 | 24 | 0 |
| ward | 86 | 122 | 3 |
| web | 559 | 568 | 0 |

`local-eslint` is the one clean package — it already has an `enforce-import-dependencies: 'off'`
escape hatch in `eslint.config.js` for importing ESLint primitives, and its own source touches
nothing raw beyond that.

### Top specifiers per rule, by package (from the actual violation text, not guessed)

**`raw-import-ban`** — the outside package or Node builtin the message names:

| Package | Top specifiers (count) |
|---|---|
| cli | fs/promises (12), zod (10), fs (4), child_process (2), crypto (2), node:fs (2), node:readline/promises (2), path (2) |
| config | zod (9), fs/promises (6), path (5) |
| eslint-plugin | zod (22), fs (20), eslint (7), path (7), @typescript-eslint/parser (3), eslint-plugin-jest (2), @typescript-eslint/utils (2), minimatch (2) |
| hooks | zod (58), eslint (14), path (9), child_process (7), fs/promises (6), debug (5), fs (3), node:fs (2) |
| hydration | zod (48), node:fs/promises (2), node:path (1), typescript (1), path (1) |
| hydration-recipes | zod (34), fs/promises (12), path (5) |
| mcp | zod (80), fs/promises (14), path (11), glob (4), fs (4), zod-to-json-schema (3), @modelcontextprotocol/sdk/server (1) |
| orchestrator | zod (131), fs (22), fs/promises (22), child_process (14), stream (11), path (6), readline (5), events (2) |
| server | zod (47), fs/promises (22), hono (15), hono/utils/http-status (9), fs (4), child_process (2), glob (2), @hono/node-ws (2) |
| session-forensics | zod (18), fs (3) |
| shared | zod (240), fs (48), path (8), child_process (6), fs/promises (4), os (4), stream (2), net (2) |
| siegelense | zod (199), fs/promises (37), fs (18), @playwright/test (15), os (9), path (8), net (7), util/types (6) |
| testing | zod (46), fs (25), typescript (12), path (8), child_process (3), msw (3), crypto (2), msw/node (2) |
| tooling | zod (14), fs/promises (2), glob (2), typescript (1) |
| ward | zod (43), fs/promises (18), fs (9), child_process (8), stream (4), os (2), crypto (1), typescript (1) |
| web | @testing-library/react (152), zod (130), @mantine/core (86), react (66), @testing-library/user-event (47), react-router-dom (27), rxjs (15), @tabler/icons-react (10) |

**`platform-globals-ban`** — the platform global the message names:

| Package | Top globals (count) |
|---|---|
| cli | process (34), Buffer (2) |
| eslint-plugin | process (2) |
| hooks | process (102), fetch (2), ChildProcess (1), Buffer (1) |
| hydration | fetch (1), setTimeout (1) |
| hydration-recipes | process (8), crypto (6), fetch (2) |
| mcp | process (37), setTimeout (3), Buffer (1) |
| orchestrator | crypto (188), process (109), setImmediate (108), Buffer (31), AbortController (29), setTimeout (9), setInterval (3), clearInterval (3) |
| server | process (67), setTimeout (33), crypto (6), clearInterval (3), setInterval (2), Response (1), Request (1), URL (1) |
| session-forensics | process (21) |
| shared | process (29), Buffer (9), setTimeout (4), clearTimeout (2), setImmediate (1), fetch (1), crypto (1) |
| siegelense | process (474), Buffer (28), setTimeout (15), window (7), clearTimeout (6), setImmediate (6), crypto (3), AbortController (2) |
| testing | process (36), fetch (21), setInterval (21), clearInterval (21), Buffer (9), setTimeout (9), clearTimeout (4), setImmediate (3) |
| tooling | process (18), Buffer (6) |
| ward | process (110), Buffer (8), setImmediate (4) |
| web | document (268), console (73), localStorage (68), btoa (13), queueMicrotask (12), crypto (12), setTimeout (12), indexedDB (10) |

**`bin-program-spawn-ban`** — every hit, by program:

| Package | Program → suggested wrapper |
|---|---|
| orchestrator | `lsof` → `listeningPids()` from `@dungeonmaster/bin/lsof` (×1); `kill` → `killPid()` from `@dungeonmaster/bin/kill` (×1) |
| siegelense | `git` → `currentBranch()` from `@dungeonmaster/bin/git` (×1) |
| ward | `lsof` → `listeningPids()` from `@dungeonmaster/bin/lsof` (×2); `kill` → `killPid()` from `@dungeonmaster/bin/kill` (×1) |

## A real rule bug found during measurement, not fixed here

`platform-globals-ban`'s `Buffer` message names `@dungeonmaster/node/Buffer` (capital B) — e.g.
`hooks`'s `build-folder-types-table-transformer.test.ts:33`. Orchestrator ruling #2 folds the
`Buffer`/`buffer` case collision into one lowercase `buffer` folder (`@dungeonmaster/node/buffer`
is the real subpath; there is no `Buffer` folder). The rule's `gatewayPath` construction reads the
identifier's own casing verbatim instead of lowercasing it for this one collision case, so every
`Buffer` hit across every package in the table above points callers at a gateway path that will
not exist once the migration lands. Flagged for whoever turns `platform-globals-ban` back on —
not fixed in this pass, since fixing it means touching the rule broker rather than measuring it.
