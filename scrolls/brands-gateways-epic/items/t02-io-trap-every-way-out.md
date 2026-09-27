# T02: The I/O trap covers every way out of the process

| | |
|---|---|
| Phase | Phase 5 — tests and mocking |
| Source | `scrolls/brands-types-tests-rules.md`, T8 table and trap bullets (lines 1899-1941), "Holes" (2165-2181), row 2209, open decision 9 (2426-2427) |
| Needs | T01 |
| Unblocks | T05, T09 |
| Packages touched | `testing` (the trap file), plus any package whose unit tests newly fail because a call they relied on going untrapped is now trapped |
| Checks to run | `lint,typecheck,unit,integration` |
| Split | one agent for the trap file itself, then narrow follow-up agents per package that goes red, 2-4 files each |
| Runs alone | no |

## Why

Node and the browser fix the ways a process can reach the outside world; the repo does not get to
invent new ones or skip old ones. Two covers exist: the I/O trap (fails a test on any call nothing
staged, files/processes/sockets) and MSW (fails a test on any HTTP or WebSocket call nothing staged,
T01). Today the trap only wraps `fs`, `fs/promises` and `child_process`. Five more ways out get through
it untouched, and five more general holes exist regardless of which modules are wrapped. Real code today
relies on some of these holes staying open in tests: `net`, `fetch`, `process.kill` are each called
directly by a handful of adapters with no unit-test cover forcing them to stage the call.

## Current state

Checked 2026-09-26 against this worktree:

- `packages/testing/src/jest.setup-io-trap.js:25`: `const TRAPPED_MODULES = ['fs', 'fs/promises',
  'child_process'];` — matches the doc exactly.
- `packages/testing/src/jest.setup-io-trap.js:38`: `const READ_ONLY_FUNCTIONS = new Set([...])` exists —
  contents not enumerated here; extend it by name only, the same way `net.isIP` will need to be added
  once `net` is trapped.
- The three caller-facing lint rules the gateway migration built are all commented out today:
  `packages/eslint-plugin/src/brokers/config/dungeonmaster/config-dungeonmaster-broker.ts:151-155` has
  `'@dungeonmaster/raw-import-ban'`, `'@dungeonmaster/platform-globals-ban'` and
  `'@dungeonmaster/bin-program-spawn-ban'` each commented out, confirmed by reading the file. Turning
  them on is gateway follow-up item 29, not this item — this item only extends the trap and the
  `READ_ONLY_FUNCTIONS` list.
- The trap wraps only lowercase function exports (`trapObject`, `jest.setup-io-trap.js:85` per the doc;
  not independently re-read line-by-line here) — a class export such as `fs.ReadStream` passes through
  untouched, and a blocked call made after its test ended is reported against the wrong test or not at
  all (`afterEach` drain, `jest.setup-io-trap.js:146` per the doc).

## Work

1. **Extend `TRAPPED_MODULES`** in `packages/testing/src/jest.setup-io-trap.js` to also cover `net`,
   `tls`, `dgram`, `dns`, `dns/promises` and `http2`, plus `process.kill`, the `Worker` constructor, and
   the `connect` and `listen` methods on the socket and server prototypes. The message the trap raises
   should name `registerMock` in the calling file's proxy and the recorded-failure stubs to use (T2, T8 —
   this is row 2209 of the doc's rules-that-change table).

2. **Add every no-I/O function in the newly trapped modules to `READ_ONLY_FUNCTIONS`**, the same way
   fixture reads are already passed by name. `net.isIP` is the doc's own example. This list names Node's
   API, so it changes only when Node's does — do not build a heuristic, enumerate the functions.

3. **Fix each caller the newly trapped modules break.** The doc's own list, checked 2026-09-25, of where
   these holes matter today:

   | Hole | Where it matters today |
   |---|---|
   | `net` sockets and servers | `orchestrator/…/net-check-port-free-adapter.ts`, `shared/…/net-free-port-pair-adapter.ts`, `siegelense/…/net-unix-request-adapter.ts`, `siegelense/…/net-unix-serve-adapter.ts` |
   | `fetch` over HTTP | fetch adapters in `hooks`, `hydration`, `hydration-recipes`, `orchestrator`, `shared`, `siegelense`, `web` (covered by MSW once T01 lands for that package, not by this item's trap extension) |
   | `process.kill` | `orchestrator/…/process-signal-adapter.ts`, `orchestrator/…/proc-check-alive-adapter.ts`, `siegelense/…/process-is-alive-adapter.ts`, `siegelense/…/process-kill-group-adapter.ts` |

   Confirm each still exists at these paths before editing (these are pre-gateway-migration adapter
   paths; if Phase 2's adapter deletion has already moved this logic into a gateway wrapper or a broker
   by the time this item runs, fix the successor file instead and note it under DECISIONS). Each caller's
   unit test needs its own proxy to stage the now-trapped call, following T1/T2/T3 (composing the
   relevant gateway wrapper's proxy once the gateway wrapper exists, or staging the raw call in the
   calling file's own proxy with `registerMock` when no gateway wrapper covers it yet).

4. **Check MSW's own Node interceptors against the newly trapped modules (open decision 9).** MSW's Node
   interceptors sit on top of `http`, and whether they call into `net`, `tls` or `dns` themselves is not
   checked as of the source doc. Before flipping this trap extension on, run a package that loads both
   the trap and MSW (once T01 lands) and confirm an MSW-staged HTTP response still works — if MSW's own
   interceptor calls trigger the trap's `net`/`tls` wrapper on their own internal socket use, that is a
   real conflict to resolve, not a false alarm to suppress.

5. **Leave classes and late calls as known, documented holes for this item** — fixing `trapObject`'s
   lowercase-function-only wrapping and the `afterEach` drain's late-call reporting is not in scope here;
   note them in the item's own report under LEFT STANDING if still open, so a later item can pick them up
   explicitly.

## Lint rules this item adds or changes

None. The three caller-facing rules (`raw-import-ban`, `platform-globals-ban`, `bin-program-spawn-ban`)
are turned on by gateway follow-up item 29 / epic item A19, not here.

## Teaching text this item changes

None directly — `jest.setup-io-trap.js`'s own failure message changes (row 2209), which is code, not a
served doc.

## Done when

- `TRAPPED_MODULES` includes `net`, `tls`, `dgram`, `dns`, `dns/promises`, `http2`, and the trap also
  covers `process.kill`, the `Worker` constructor, and `connect`/`listen` on socket and server prototypes.
- `READ_ONLY_FUNCTIONS` lists every no-I/O function in those modules that a test calls today (`net.isIP`
  at minimum).
- Every caller in the "Where it matters today" table has a passing unit test that stages its now-trapped
  call, or a documented reason it is out of scope (moved by Phase 2, deleted, etc.).
- `npm run ward -- --uncommitted` exits 0 on every touched file.
- Open decision 9 (MSW vs. the trap on `net`/`tls`/`dns`) is either confirmed clear or written up under
  DECISIONS with what was found.

## Traps

- A consumer repo effect, not a hole: once this item's trap extension ships in a published
  `@dungeonmaster/testing`, a consumer's unit tests that touch `net`, `dns` or `process.kill` directly
  will start failing the same way the fs/child_process extension did in `fe456add9`. This is expected,
  not a regression to chase.
- The gateway build already flagged that `platform-globals-ban` "misses a global used as an object
  shorthand, such as `{ fetch }`" and "does not special-case siegelense's `page.evaluate` callbacks" —
  these are the caller-facing rule's own gaps (item 29), not this item's, but if this item's trap
  extension surfaces a test relying on one of those gaps, note it rather than silently working around it.
- Do not confuse this item's job (extend what the trap wraps) with T05/T08's job (fix what proxies do
  once a call is trapped). This item only needs the failing test to go red for the right reason; T05 and
  T08 fix invented failures and catch-everything handling.

## Concessions made while executing

<Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table.>
