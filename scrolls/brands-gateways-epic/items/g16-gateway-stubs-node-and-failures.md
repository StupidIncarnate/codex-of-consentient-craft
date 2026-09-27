# G16: Gateway stubs — the colocation rule, recorded failures, Node library types

| | |
|---|---|
| Phase | Phase 1 — gateway foundation |
| Source | `scrolls/gateway/followup-sustainability.md`, item 25, lines 583-628 (step 1, step 3, step 4, and the Node-library rows of the "how each replacement builds its value" table); `scrolls/brands-types-tests-rules.md`, "What dungeonmaster ships for tests…", lines 1956-1986 |
| Needs | [G26](g26-per-file-proxy-and-stub-imports.md) (the per-file import form every new stub in this item uses) |
| Unblocks | [G18](g18-gateway-stub-every-subpath.md) (turns the colocation check on), [G19](g19-gateway-proxies-recorded-failures-no-catch-all.md) (needs the `ECONNREFUSED` stub), [G20](g20-gateway-schemas-gateway-brand.md) (needs this item's stub shape), [B05](b05-other-library-type-copies.md) |
| Packages touched | `eslint-plugin` (the colocation extension), `@gateway/node` (new stubs) |
| Checks to run | `lint,typecheck,unit` |
| Split | one agent |
| Runs alone | no |

This item is one of three pieces the operator split gateway follow-up item 25 into (EPIC.md concession
5). This piece covers: the `gateway-colocation` rule change that will require a stub (built here,
switched on in G18), the recorded-failure stubs (network and process errors), the Node-only library
stubs (`ChildProcessStub`, `StatsStub`, a timer stub), and the general stub-writing rules. AST/rule
context/TypeScript-source stubs are [G17](g17-gateway-stubs-ast-and-typescript.md). Filling in every
remaining subpath is [G18](g18-gateway-stub-every-subpath.md).

## Why

Every gateway subpath is supposed to ship at least one stub, so a test never builds an outside
package's value by hand. Today `@dungeonmaster/testing` ships none — outside-type stubs belong in the
gateway (BR C5), not there — and a 2026-09-26 census (see "Current state") found that only one gateway
folder in the whole repo has a `.stub.ts` file. Several repo stubs that stand in for real Node/library
values are actively harmful: they are typed as OUR copy of the real type rather than the real type
itself, so production code that receives the real value (a real `Stats`, a real `ChildProcess`)
receives an object missing the methods the stub never modeled. The fix is a gateway stub, typed with
the real type, that builds a complete, real value.

## Current state

Checked 2026-09-26 against the code:

- **Census of `.stub.ts` files across the whole gateway** (python `os.walk` over
  `packages/@gateway/*/src/*`): every subpath in every one of the four gateway packages has ZERO
  stubs, except `node/fs`, which has exactly one: `packages/@gateway/node/src/fs/is-fs-error/fs-error.stub.ts`.
  That is `npm`: 39 of 39 subpaths with none. `node`: 21 of 22 (only `fs` has one). `browser`: 20 of 20.
  `bin`: 6 of 6. This is the shape G18 has to close; this item only has to build the FIRST stubs (the
  ones named below) and the check, not close out every subpath.
- The one existing stub is the pattern to follow:

  ```typescript
  // packages/@gateway/node/src/fs/is-fs-error/fs-error.stub.ts
  export const FsErrorStub = ({ code, path, syscall }: { code: string; path?: string; syscall?: string }): FsError =>
    Object.assign(new Error(`${code}: ${syscall ?? 'op'} '${path ?? ''}'`), {
      code,
      ...(path === undefined ? {} : { path }),
      ...(syscall === undefined ? {} : { syscall }),
    });
  ```

  It is typed with `FsError` (a type the gateway itself declares, in `fs-error.ts`, not a copy of a
  real Node type — `fs/promises` throws a plain `Error` with extra fields, so there is no real
  `FsError` class to import). It builds a real `Error` instance, not a bare object, with a comment
  explaining why: `registerMock`'s `.rejects()` staging step substitutes a generic `new Error(...)`
  for any rejection value that fails both `instanceof Error` and `isNativeError`, which would silently
  drop `code` — so the stub has to already be a real `Error` to survive that path unchanged.
  `is-fs-error.proxy.ts` composes on top of it (`FsErrorStub({ code })` for a match,
  `FsErrorStub({ code: `NOT_${code}` })` for a mismatch). Per G26, each stub and proxy is imported from its
  own file — `#gateway/node/fs/is-fs-error/fs-error.stub` — confirming the per-file import pattern this
  item's new stubs must also follow.
- `packages/@gateway/node/src/child_process/child_process.ts` is the barrel; `node/src/child_process/`
  already holds `run`, `run-fire-and-forget`, `run-not-found-error`, `run-sync`, `spawn-detached`,
  `spawn-live`, `spawn-long-lived`, `stream`, `stream-lines` folders, but no stub folder and no
  `.stub.ts` anywhere in the subpath.
- `packages/@gateway/node/src/setTimeout/setTimeout.ts` is a one-line global capture:
  `export const { setTimeout } = globalThis;`. No stub exists yet.
- No `net`, `fs__promises`, or `bin` subpath has anything resembling `ECONNREFUSED`, `EADDRINUSE`,
  `ENOTFOUND` or `ESRCH` today (checked by folder listing — none of these names appear anywhere under
  `packages/@gateway/`).
- `packages/@gateway/node/src/fs/stat-sync/` exists (the sync `fs.Stats`-returning wrapper), but there
  is no `Stats`-typed schema or stub anywhere in the gateway yet.
- `packages/@gateway/node/src/fetch/fetch-json/fetch-json.proxy.ts` (and the browser twin) both expose
  `setupNetworkError: ({ url, error }: { url: string; error: Error }) => void`, accepting ANY `Error` —
  this is exactly the gap item 24 (see [G19](g19-gateway-proxies-recorded-failures-no-catch-all.md))
  needs an `ECONNREFUSED` stub to close, which is why G19 lists this item as a dependency.
- The repo's stubs this item's work eventually lets be DELETED (not this item's own job — that deletion
  happens in `B05` and in the packages that own the copies today) are named here so the shape is clear:
  `ChildProcessStub` (hooks), `FileStatsStub` (hooks), `TimerHandleStub` (testing). This item only
  builds their gateway replacements.

## Work

### 1. Extend `gateway-colocation` to require a stub per subpath (built, not switched on)

Add a THIRD check to `rule-gateway-colocation-broker.ts` (or a sibling rule, if the existing broker is
already large — the executing agent decides, following this package's own file-size conventions):
every subpath must have at least one `.stub.ts` file somewhere under its folder. Gate this check behind
a static flag or a separate rule ID so it can ship
DISABLED — G18 is the item that turns it on, once every subpath actually has a stub. Turning it on here
would fail on every subpath census above shows has none (all but one, repo-wide).

### 2. Write the gateway stubs that replace the repo's copied-type stubs (Node-only rows)

This item covers the Node/child-process/timer rows of the table; G17 covers the AST/rule-context/source-file rows.

| Deleted later | Replaced by, in the gateway |
|---|---|
| `ChildProcessStub` (hooks) | a stub in `node/child_process` |
| `FileStatsStub` (hooks) | `StatsStub` in `node/fs` |
| `TimerHandleStub` (testing) | a stub in `node/setTimeout` |

How each builds its value (checked 2026-09-24 on Node 22.17, per the source doc):

| Stub | How it builds the value |
|---|---|
| child process | `new ChildProcess()` gives a real instance without spawning, with `PassThrough` streams attached. |
| timer | `setTimeout` gives a real handle, cleared. `.unref()` gives one whose `hasRef()` is `false`. |
| `StatsStub` | The `fs.Stats` constructor works but is deprecated (warning `DEP0180`), so the stub builds the complete object: about 14 data fields, 4 date getters and 7 `is…()` methods. That object is not `instanceof fs.Stats`, so a `Stats` schema uses `z.custom` with a check, not `z.instanceof` (G20's job — this item just needs the STUB, G20 needs the SCHEMA that will accept the stub's output). |

Every stub follows the same rules, from the source doc (GW 585-591):

- Typed with the outside package's own type, or a type the gateway declares — never one of our
  contracts.
- Builds a COMPLETE value, with no `Partial` and no cast. Gateway runtime code may cast to the real
  type; a stub may not, because building the value correctly IS its whole job.
- Builds whatever the module hands back, not only objects.

Concretely:

- **`node/child_process/child-process/child-process.stub.ts`** (folder name is a recommendation —
  follow this package's existing wrapper-folder naming: kebab-case, one folder per thing it stubs):
  `new ChildProcess()` from the real `child_process` module, with `PassThrough` streams (from
  `#gateway/node/stream` if that subpath exists, or Node's `stream` module directly inside the
  gateway — the gateway may import Node's own builtins unwrapped, since it IS the wrapper) attached to
  `stdout`/`stderr`/`stdin` so a caller can write/read against them without a real process. It is imported
  from its own file: `#gateway/node/child_process/child-process/child-process.stub`.
- **`node/setTimeout/timeout/timeout.stub.ts`** (or wherever it best sits given `setTimeout`'s
  single-file subpath shape): calls the REAL `setTimeout` to get a real handle, then clears it
  immediately (`clearTimeout(handle)`) so the stub never actually fires — a real, inert handle rather
  than a fake object shaped like one. Offer a second builder or a parameter for the `.unref()`
  variant, whose `hasRef()` reads `false`. Name it so BR's own naming survives:
  BR's C5 table calls this `TimeoutStub`, imported as `#gateway/node/setTimeout/timeout/timeout.stub`
  — match that name exactly, since B05 will import it by that name later.
- **`node/fs/stats/stats.stub.ts`** (a new wrapper folder beside `stat-sync`, or wherever the
  executing agent judges it belongs — there is no existing `Stats`-specific folder yet): builds the
  complete object by hand (the constructor is deprecated, per DEP0180), covering every data field,
  date getter and `is…()` method a real `fs.Stats` carries. Name it `StatsStub`, matching BR's table,
  imported from its own file: `#gateway/node/fs/stats/stats.stub` (alongside the existing
  `#gateway/node/fs/is-fs-error/fs-error.stub`).

### 3. Write the recorded-failure stubs

One stub per named failure, in the module whose failure it records:

- **`FileMissingErrorStub`** — an `ENOENT`-shaped error, in `node/fs` (the existing `FsErrorStub`
  already covers this shape generically via `FsErrorStub({ code: 'ENOENT', ... })`; decide whether
  `FileMissingErrorStub` is a thin named wrapper around `FsErrorStub` for readability at call sites, or
  a separate function — record the choice under DECISIONS if it is not obviously "reuse
  `FsErrorStub`").
- **`ECONNREFUSED`** — in `node/net` (or wherever the real connection-refused error would surface;
  check what module a real `fetch`/`net` failure raises this code from before picking the home). This
  is the one [G19](g19-gateway-proxies-recorded-failures-no-catch-all.md) needs directly, to replace
  `fetchJsonProxy`'s `setupNetworkError({ url, error: Error })` (which today accepts ANY `Error` — see
  "Current state" above) with a named scenario built on this stub.
  **A recorded-failure stub makes the failing call for real where it can** (per BR's "What
  dungeonmaster ships" table) — connecting to a port nothing listens on is a real, offline-triggerable
  failure, so prefer capturing the REAL error Node raises from a real refused connection over
  hand-building the shape, if that is practical inside a stub file (the I/O trap explicitly lets
  `.stub.ts` files do real I/O, per BR's own note: "the trap lets `.stub` files do real I/O, so the
  error always matches the installed Node").
- **`EADDRINUSE`** — in `node/net`, alongside `free-port-pair` and `is-port-free` if those exist there
  already (check the subpath's existing wrapper folders first). Same "real call where possible" rule:
  binding a real listener on a port already held by another real listener the stub itself opens is a
  triggerable-offline failure.
- **`ENOTFOUND`** — a DNS lookup failure. This is the source doc's own example of the one case that
  CANNOT be triggered offline (no network, no real DNS server to say "not found" against) — "a failure
  that cannot be triggered offline, such as a DNS miss, is a copy captured once." Build it as a
  captured/hand-built shape, matching a real Node DNS error's fields (`code: 'ENOTFOUND'`, `hostname`,
  `syscall: 'getaddrinfo'`), and say so in the stub's own comment (recording the decision the way this
  package's other comments record a decision-and-state, not "gets a fake error").
- **`ESRCH`** — "no such process," raised by `process.kill` against a pid that does not exist. Likely
  home: wherever `bin/kill` or `node`'s own process-signal wrapper lives. Real, offline-triggerable: a
  real `process.kill` against a pid guaranteed not to exist (e.g. re-using a pid just reaped) raises
  this for real; prefer that over a hand-built shape if practical.

### 4. Keep `enforce-stub-usage`'s existing gateway skip; the brands doc's new C5 rule DOES apply here

`enforce-stub-usage`'s `isGatewayFileGuard` skip stays exactly as it is for that rule's OWN existing
checks (whatever those check today — read the rule before touching it, this item does not change its
behavior). What DOES apply to gateway files, per the source doc, is BR's new C5 check ("a test value
of an outside package's type comes from the gateway's stub, never from a copy or a cast" — see BR
1215-1316, quoted in full in G17's item file). That check refuses an object literal cast to an outside
package's type INSIDE a test, proxy or stub file — including a gateway one. Do not exempt gateway stub
files from THAT rule; a gateway stub building its value by casting a partial object to the real type
(instead of actually constructing/capturing a complete real value) is exactly the failure C5 exists to
catch. That rule is built in [G17](g17-gateway-stubs-ast-and-typescript.md) (the AST/rule-context
half); confirm here that none of this item's new stubs use a bare object-literal cast before handing
off.

## Lint rules this item adds or changes

- **`gateway-colocation`, "every subpath needs a stub" check**: built here, disabled by default (a
  static flag or separate rule ID G18 flips on once every subpath has one). Post-edit (reads the file
  system).

## Teaching text this item changes

None yet — Phase 6 rewrites the gateway folder-type doc once every code item, including this one, has
landed.

## Done when

- [ ] `gateway-colocation` (or a sibling rule) has the stub-required check written and covered by a
      RuleTester test, but shipped OFF.
- [ ] `node/child_process` has a `ChildProcess`-typed stub, imported from its own file.
- [ ] `node/setTimeout` has a `TimeoutStub` (real handle, cleared) with an `.unref()` variant, imported
      from its own file.
- [ ] `node/fs` has a `StatsStub` (complete object, all data fields/date getters/`is…()` methods, not
      `instanceof fs.Stats`), imported from its own file alongside the existing `FsErrorStub`.
- [ ] `FileMissingErrorStub`, and stubs for `ECONNREFUSED`, `EADDRINUSE`, `ENOTFOUND` and `ESRCH` exist,
      each beside the module whose failure it records, each imported from its own file.
- [ ] Every new stub is typed with the real outside type or a gateway-declared type, builds a complete
      value, and uses no `Partial` and no cast.
- [ ] `npm run ward -- -- <files touched>` exits 0.

## Traps

- Do not turn the "every subpath needs a stub" check ON in this item — it WILL fail the whole repo
  (only one subpath passes today). That is explicitly G18's job, after G18 fills in the rest.
- `fs.Stats`'s constructor works but warns `DEP0180` — do not silence the warning by calling the
  constructor anyway; build the object by hand instead, per the source doc's own instruction.
- A recorded-failure stub is not automatically "captured once" — prefer a REAL call where the failure
  can genuinely be triggered offline (files, refused connections, in-use ports, missing processes). DNS
  is the one named exception. Getting this backwards (hand-building a shape for a failure that could
  have been triggered for real) produces a stub whose fields quietly drift from what Node really
  raises.

## Concessions made while executing

<Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table.>
