# G18: A stub for every remaining gateway subpath

| | |
|---|---|
| Phase | Phase 1 — gateway foundation |
| Source | `scrolls/gateway/followup-sustainability.md`, item 25 step 1 (the rest of it — "every subpath ships at least one stub"), lines 583-596 |
| Needs | [G16](g16-gateway-stubs-node-and-failures.md) (builds the colocation check this item switches on, and the Node/failure stub patterns to follow), [G17](g17-gateway-stubs-ast-and-typescript.md) (the AST/rule-context/source-file stub patterns) |
| Unblocks | nothing directly, but every later item that assumes "every gateway subpath has a stub" (e.g. B05) depends on this being true |
| Packages touched | `@gateway/npm`, `@gateway/node`, `@gateway/browser`, `@gateway/bin` |
| Checks to run | `lint,typecheck,unit` |
| Split | operator splits per gateway package — one agent group for `npm`, one for `node`, one for `browser`, one for `bin`. Within a package, split further by subpath, 2 to 4 subpaths per agent. |
| Runs alone | no |

This is the third of three pieces the operator split gateway follow-up item 25 into (EPIC.md concession
5). G16 and G17 built the FIRST stubs and the check that requires one per subpath, but left the check
OFF because almost no subpath had one yet. This item's whole job is closing that gap — write a stub for
every subpath the census below still lists — and then flipping the check on.

## Why

`gateway-colocation`'s new "every subpath needs a stub" check (built in G16) cannot be turned on while
the vast majority of subpaths have none — it would fail the whole repo on the first scan. This item does
the mechanical work of closing that gap, subpath by subpath, so the check can actually run.

## Current state

Full census, `python3 os.walk` over `packages/@gateway/*/src/*`, checked 2026-09-26 (a subpath counts as
covered if a `.stub.ts` file exists ANYWHERE under its folder, at any depth):

**`npm` — 39 of 39 subpaths have no `.stub.ts`:**
`debug`, `elkjs`, `eslint`, `eslint-plugin-eslint-comments`, `eslint-plugin-jest`, `fast-xml-parser`,
`glob`, `hono`, `hono__node-server`, `hono__node-ws`, `hono__utils__http-status`, `mantine__core`,
`mantine__notifications`, `minimatch`, `modelcontextprotocol__sdk__server`,
`modelcontextprotocol__sdk__server__stdio`, `modelcontextprotocol__sdk__types`, `msw`, `msw__node`,
`pixelmatch`, `playwright__test`, `pngjs`, `react`, `react-dom__client`, `react-router-dom`, `rxjs`,
`rxjs__operators`, `tabler__icons-react`, `testing-library__jest-dom`, `testing-library__react`,
`testing-library__user-event`, `typescript`, `typescript-eslint__eslint-plugin`,
`typescript-eslint__parser`, `typescript-eslint__utils`, `vitejs__plugin-react`, `xyflow__react`, `zod`,
`zod-to-json-schema`.

**`node` — 21 of 22 subpaths have no `.stub.ts`** (`fs` is the one exception, and after G16 lands it
will have three: the existing `FsErrorStub`, plus `StatsStub` and the new recorded-failure stubs G16
adds): `atob`, `buffer`, `child_process`, `clearInterval`, `clearTimeout`, `console`, `crypto`, `events`,
`fetch`, `fs__promises`, `module`, `net`, `os`, `path`, `process`, `readline`, `setInterval`, `setTimeout`,
`url`, `util`, `util__types`. **Note:** `child_process` and `setTimeout` are covered by G16's own new
stubs — confirm they landed before re-doing them here.

**`browser` — 20 of 20 subpaths have no `.stub.ts`:**
`AbortController`, `Blob`, `FileReader`, `ResizeObserver`, `URL`, `WebSocket`, `XMLHttpRequest`, `atob`,
`console`, `createImageBitmap`, `crypto`, `document`, `fetch`, `indexedDB`, `localStorage`, `location`,
`navigator`, `requestAnimationFrame`, `sessionStorage`, `window`.

**`bin` — 6 of 6 subpaths have no `.stub.ts`:**
`claude`, `cp`, `git`, `kill`, `lsof`, `npm`.

**Some of these will already be partly covered by other in-flight items by the time this one starts** —
re-run the census (the python one-liner in G16's own "Current state" section) before splitting the work,
since G16, G17, G19, G20 and G21 all touch some of these same subpaths and may add a stub as a side
effect of their own work (G20 in particular adds a schema-backed stub for every gateway type a contract
holds, which could cover several `npm`/`node` subpaths before this item even starts).

## Work

For each subpath still missing a stub:

1. Decide what the subpath's outside value actually IS. Most subpaths pass through a real npm package,
   a Node builtin, a browser global, or a spawned program's output — the stub should build (or, where
   the value is a class instance a real call would produce, construct via the real constructor/API)
   whatever that subpath's callers would receive.
2. Follow the same rules as G16 and G17's own stubs: typed with the outside package's own type or a
   type the gateway declares (never one of our contracts), builds a COMPLETE value, no `Partial`, no
   cast.
3. Where a subpath is a pure pass-through with no wrapper folder of its own (e.g. `npm/src/zod/zod.ts`,
   which is `export * from 'zod'` with an added `export { default } from 'zod'`), the stub covers the
   real module's own most-used exported value or type — for `zod`, for example, a stub might build a
   minimal real `ZodType` instance, or (if nothing in the repo actually needs a stubbed `zod` value
   today) the simplest honest thing may be a stub for whatever type the subpath's own barrel test
   already asserts matters. Use judgment; this item does not get to invent a stub that nothing will
   ever import — check whether ANY current or soon-to-land caller (including this epic's own upcoming
   items) needs a stub for this subpath before spending real effort on an elaborate one. A minimal,
   correctly-typed stub of the module's most obviously useful value is enough to satisfy the
   colocation check; it does not have to anticipate every future need.
4. Each new stub is a file of its own, imported per file — no barrel to export it from.
5. Give each stub the colocation pair it needs (test/proxy, per whatever `gateway-colocation`'s
   `.stub.ts` exemption or requirement turns out to be — check this against G16/G17's own resolution of
   that question before assuming).

## Once every subpath has a stub

6. Turn ON the "every subpath needs a stub" check G16 built (whatever flag or rule-ID toggle G16 used).
7. Run the check as a scan over the whole `packages/@gateway/` tree and hand-check a sample of what it
   flags and what it lets through, per EPIC.md's standing rule for any item that switches a rule on.
8. Fix anything the scan still flags — a subpath this item's split missed, or a stub that does not
   quite satisfy the check's shape.

## Lint rules this item adds or changes

- Turns ON the "every subpath needs a stub" mode of `gateway-colocation` that G16 built disabled.
  No new rule.

## Done when

- [ ] Every subpath under `packages/@gateway/npm/src/`, `packages/@gateway/node/src/`,
      `packages/@gateway/browser/src/`, `packages/@gateway/bin/src/` has at least one `.stub.ts` file,
      imported from its own file — no barrel involved.
- [ ] `gateway-colocation`'s "every subpath needs a stub" check is switched ON.
- [ ] A whole-repo lint scan with the check on shows zero violations.
- [ ] `npm run ward -- -- <files touched>` exits 0, and a bare `npm run ward -- --only lint` (whole
      repo) also exits 0 once every split agent's work has landed — this is the one item in Phase 1
      whose "done" state genuinely depends on the WHOLE gateway tree, so the operator should treat the
      final agent's ward run as the integration check for all the split agents' work together.

## Traps

- Re-run the census before splitting — several other Phase 1 items (G16, G17, G19, G20, G21) land stubs
  as a side effect of their own work, and this item should not duplicate them.
- Do not turn the check on until every split agent's stubs have actually landed — turning it on early
  (before the last group finishes) will show false failures for subpaths another agent is still working
  on, and an agent seeing red on a file outside their own scope may waste time investigating it.
- A stub built purely to satisfy the check, with no real caller in sight, is still worth writing
  correctly (typed with the real type, complete value) — but do not invent an elaborate multi-scenario
  stub file for a subpath nothing uses yet. Judgment call; note anything unusually thin under
  DECISIONS so a later item that DOES need more from that subpath's stub knows to extend it rather than
  replace it.

## Concessions made while executing

<Empty at the start. The operator fills this and mirrors it into EPIC.md's Concessions table.>
