# Z05: Every `PURPOSE` header in `packages/@gateway`

| | |
|---|---|
| Phase | Phase 6 — docs and finish |
| Source | `scrolls/gateway/followup-sustainability.md`, item 46 (lines 927-948) |
| Needs | every A, B, G, T item |
| Unblocks | Z07 |
| Packages touched | `@gateway` (all four: `npm`, `node`, `browser`, `bin`) |
| Checks to run | `lint,typecheck,unit,integration` |
| Split | operator splits per subpath, 2-4 files per agent (batches below) |
| Runs alone | no (runs with Z01-Z04, Z06) |

## Why

The gateway's file headers were written while it was being built, so many describe the build rather than
the file: how a wrapper "reconciles" an old adapter, why something "cannot be a property on `index.ts`'s
moduleGateway" (a barrel form that no longer exists), callers named as `@dungeonmaster/bin/*` instead of
`#gateway/bin/...`, and pointers to a gateway follow-up item number that changes or disappears as items
close. None of this belongs in a PURPOSE header — this repo's own comment-discipline rule says history
goes in the plan document for the change, never in a code comment, and a header must state what the file
does and why it is shaped that way, in the present tense.

## Current state

Censused 2026-09-26 with a `python3 os.walk` over `packages/@gateway`, counting `.ts` files whose first
400 bytes contain the string `PURPOSE`. 235 files carry a header. Per-subpath breakdown (file count per
subpath folder, from this run):

| Package | Subpaths with a PURPOSE header, and how many files each |
|---|---|
| `bin/src/` | `claude` 4, `cp` 4, `git` 20, `kill` 5, `lsof` 3, `npm` 6 |
| `browser/src/` | `AbortController` 1, `Blob` 1, `FileReader` 1, `ResizeObserver` 1, `URL` 1, `WebSocket` 2, `XMLHttpRequest` 1, `atob` 1, `console` 1, `createImageBitmap` 1, `crypto` 1, `document` 1, `fetch` 3, `indexedDB` 5, `localStorage` 5, `location` 1, `navigator` 1, `requestAnimationFrame` 1, `sessionStorage` 1, `window` 1 |
| `node/src/` | `atob` 1, `buffer` 1, `child_process` 10, `clearInterval` 1, `clearTimeout` 1, `console` 1, `crypto` 1, `events` 1, `fetch` 4, `fs` 28, `fs__promises` 37, `module` 3, `net` 5, `os` 1, `path` 1, `process` 15, `readline` 3, `setInterval` 1, `setTimeout` 1, `url` 1, `util` 1, `util__types` 1 |
| `npm/src/` | one subpath each holding 1-2 files: `debug`, `elkjs`, `eslint`, `eslint-plugin-eslint-comments`, `eslint-plugin-jest`, `fast-xml-parser` (2), `glob` (2), `hono`, `hono__node-server`, `hono__node-ws`, `hono__utils__http-status`, `mantine__core`, `mantine__notifications`, `minimatch`, `modelcontextprotocol__sdk__server`, `modelcontextprotocol__sdk__server__stdio`, `modelcontextprotocol__sdk__types`, `msw`, `msw__node`, `pixelmatch`, `playwright__test`, `pngjs` (2), `react`, `react-dom__client`, `react-router-dom`, `rxjs`, `rxjs__operators`, `tabler__icons-react`, `testing-library__jest-dom`, `testing-library__react` (2), `testing-library__user-event`, `typescript`, `typescript-eslint__eslint-plugin`, `typescript-eslint__parser`, `typescript-eslint__utils`, `vitejs__plugin-react`, `xyflow__react`, `zod`, `zod-to-json-schema` |

`node/src/fs` (28), `node/src/fs__promises` (37) and `node/src/child_process` (10) are the largest single
subpaths and each needs several batches on their own. `bin/src/git` (20) is the next largest.

A 2026-09-26 spot check of four headers (from the source doc) found each kind of problem below, and is
not re-verified line-by-line here — treat these four as confirmed examples to fix, not as the whole list:

| Problem | Example |
|---|---|
| Tells the history of the adapters it replaced | `bin/src/git/current-branch/current-branch.ts` opens with how it "reconciles orchestrator's async `gitCurrentBranchAdapter`" with siegelense's; `npm/src/pngjs/decode-png/decode-png.ts` is "promoting the try/catch-with-cause shape every existing `pngjsDecodeAdapter` already carried" |
| Describes a layout that no longer exists | `node/src/module/dynamic-import/dynamic-import.ts` explains why it cannot be "a property on `index.ts`'s `moduleGateway`" — there is no `index.ts` barrel any more |
| Uses the old import form | `node/src/child_process/run-not-found-error/run-not-found-error.ts` names callers as `@dungeonmaster/bin/*`, not `#gateway/bin/...` |
| Points at a follow-up item by number | `current-branch.ts` and `bin/src/lsof/listening-pids/listening-pids.ts` cite gateway follow-up items 32 and 33, which change number or disappear as items close |

## Work

1. **Read every file with a PURPOSE header** — a text search cannot find these reliably (a header can be
   grammatically fine and still describe history or a stale layout), so every wrapper, proxy, stub and
   barrel file that has one gets opened, per subpath.

2. **Rewrite each header that fails any of these four checks:**
   - States what the file does and why it is shaped that way, **in the present tense**.
   - Names no adapter it replaced, no earlier layout, no trial.
   - Cites no gateway follow-up item number.
   - Its `USAGE` example **compiles against the file as it stands** — e.g. `dynamic-import.ts`'s example
     must not pass a type parameter once gateway follow-up item 22 removes it from the real signature.

3. **Do this once every A/B/G/T item has landed**, alongside Z01-Z04/Z06, so each header is read against
   its truly final code — a header fixed before item 22 lands would need fixing again once `dynamicImport`
   actually drops its type parameter.

4. **Split per subpath, 2-4 files per agent.** Suggested batches, largest subpaths first (an agent should
   not need to touch more than one subpath, since PURPOSE headers within a subpath tend to share the same
   stale pattern — e.g. every `fs__promises` proxy citing the same old item number):

   | Batch | Subpath | Files (of the header-bearing total) |
   |---|---|---|
   | 1-10 | `node/src/fs__promises` (37) | ~4 files each, 10 batches |
   | 11-17 | `node/src/fs` (28) | ~4 files each, 7 batches |
   | 18 | `node/src/child_process` (10) | one batch, or split 2×5 |
   | 19-20 | `bin/src/git` (20) | ~4 each, 5 batches (only need 2 slots above if run alongside child_process; adjust to whatever the operator's 5-agent cap allows at the time) |
   | 21 | `node/src/process` (15) | ~4 each, 4 batches |
   | 22 | `bin/src/npm`, `bin/src/kill`, `bin/src/lsof`, `bin/src/cp`, `bin/src/claude` (6+5+3+4+4=22) | one batch per program, 4 files each |
   | 23 | `browser/src/*` (31 files across ~20 subpaths, mostly 1 file each) | group 3-4 single-file subpaths per agent |
   | 24 | `npm/src/*` (43 files across ~36 subpaths, mostly 1-2 files each) | group 3-4 single-file subpaths per agent |
   | 25 | remaining `node/src/*` singles (`atob`, `buffer`, `clearInterval`, `clearTimeout`, `console`, `crypto`, `events`, `os`, `path`, `readline`, `setInterval`, `setTimeout`, `url`, `util`, `util__types`, `net`, `module`) | group 3-4 per agent |

   These counts are from the 2026-09-26 census above; re-run the same `python3 os.walk` scan before
   dispatching, since file counts will have shifted once G16-G21 (gateway stubs and proxies) have added
   more files.

## Lint rules this item adds or changes

None. If a header pattern repeats badly enough to be worth enforcing (e.g. every new gateway file must
carry a PURPOSE header with no item-number citation), report that as a suggestion under LEFT STANDING —
building a new rule is out of this item's scope.

## Teaching text this item changes

None beyond the headers themselves.

## Done when

- Every `.ts` file under `packages/@gateway` carrying a PURPOSE header has been read.
- No header names an adapter it replaced, an earlier layout, a trial, or a gateway follow-up item number.
- Every `USAGE` example compiles against the file as it stands.
- `npm run ward -- --uncommitted` exits 0 on every touched file.

## Traps

- Do not start batching by guessing file counts from this item's own table without re-running the census
  first — G16-G21 add new stub and proxy files between when this item file was written and when Z05
  actually runs.
- A header that already reads fine (present tense, no history, no item number, working USAGE example)
  needs no edit — do not rewrite a header just to rewrite it; only fix the four specific failure modes.

## Concessions made while executing

<Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table.>
