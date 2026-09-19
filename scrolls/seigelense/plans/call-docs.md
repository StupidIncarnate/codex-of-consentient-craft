# `docs` — the role-scoped manual, served by a call

Plan for `dungeonmaster siegelense docs`. Spec: `scrolls/seigelense/siegelense-tooling.md`, principally lines
2361–2418. Ledger row: `build-ledger.md` §"The thirteen calls, individually", `docs` (line 179).

---

## 1. Requirements

One row per distinct thing the spec says. Every citation is a line in `siegelense-tooling.md` unless named otherwise.

| # | Requirement | Spec |
|---|---|---|
| 1 | Every call is `dungeonmaster siegelense <name>`; steps are values inside `run`'s `steps` array, never calls | 2270–2273 |
| 2 | `docs` is the tool's own instructions — **how a session learns to use it, not the prompt** | 2361 |
| 3 | `docs {}` returns the whole surface | 2364 |
| 4 | Exactly seven scopes, one per tool-using role, already pinned in `siegelenseCallStatics.docs.scopes` | 2365–2375 |
| 5 | `operating` → cleanup, capacity, status, reaping rules, reading a minion's return | 2365 |
| 6 | **`operating` contains NO step verbs at all.** The operator never submits a batch; handing it the driving verbs hands it the one thing its own rules forbid | 2378–2382 |
| 7 | `planning` → recipes, preludes, profiles, capacity, proving a prelude | 2366 |
| 8 | `walking` → the driving and reading verbs, the reading rules, and the LADDER: key first, `dom` last and narrow | 2367–2368 |
| 9 | The ladder has four rungs above the hatch, cheapest first: `look`, `look { within }`, `box { ref }`, `dom { target }`, then `eval` as a DIFFERENT hatch | 618–626, 661–665 |
| 10 | `dom`'s three guards: own text by default, `fields:` projects, a match cap that SAYS it capped with the true count beside it | 639–651 |
| 11 | `attacking` → health, reset levels, `expect: 'error'`, baselines | 2369 |
| 12 | Three state layers (disk · server memory · browser) and three named reset levels (`page` · `state` · `instance`), each declaring what it KEEPS; a snapshot covers the STATE subtree only, evidence accumulates forward | 1032–1070 |
| 13 | `health` — one reading, one verdict line: HEALTHY / DEGRADED / DOWN | 2596–2606 |
| 14 | Baselines: an antagonist gets them from the dispatch's instance+run id via `results`, starting nothing; a tainted baseline INVERTS the check; a sad-path baseline has the error in it; a toast is transient and read as presence | 1085–1125 |
| 15 | `fixing` → reading a finished run without starting anything, re-running a prelude, calling a recipe from an e2e | 2370–2371 |
| 16 | The fixer's steps 1–4 start NOTHING; step 5 is the first that needs a live instance; the cautious-direction mistake is its own failure mode | 2799–2882 |
| 17 | `driving` → the same surface for a session no quest dispatched: capacity, start, run, the reading steps, kill, and where its own evidence went | 2372–2373 |
| 18 | `driving` must say the things no other scope does — the table | 2398–2402 |
| 19 | `operational` → a flow with no screen: `request`, `file`, `until { file }`, `storage`, `results { kind: 'server' }`, and the browserless lane spec | 2374–2375 |
| 20 | A browserless spec is just another spec; browser steps go missing LOUDLY, erroring by name rather than answering an empty reading | 2293–2304 |
| 21 | `siegemaster-reader` gets no scope, and that absence is the point | 2384–2386 |
| 22 | `for:` scopes it, because the whole surface is not every reader's business | 2416–2418 |
| 23 | Why a call and not prompt text — any session can fetch it; one source; the prompt's hard ceiling (`mcpToolResultStatics.maxVerbatimChars` is 50,000) | 2404–2414 |
| 24 | Refs are for DRIVING, selectors for RECORDING; four boundaries a ref cannot cross; never store one; a stored `ref: 14` is `.first()` wearing a number | 2168–2212 |
| 25 | Every targeting step has exactly three outcomes; ambiguity is an ERROR carrying its own disambiguation; zero matches names the near misses | 2109–2139 |
| 26 | `run` returns a STATUS, never payloads; `results` returns payloads; collapsing them walks back into the 50,000-char ceiling | package `CLAUDE.md` |
| 27 | Results queries: six kinds, per-step attribution on every entry, a step's own reading reached by `step: N` with no `kind`; a click reporting zero exchanges is a FINDING | 2699–2738 |
| 28 | Teardown: three processes, a port pair, two fds, a throwaway home; six quiet failures; `kill` must not take the evidence with it | 1127–1161 |
| 29 | When an instance dies under a session: bubble up as `rework`, never `wall`, never self-heal; only the operator can see the pool | 1256–1278 |
| 30 | An unknown scope is refused BY NAME and lists the seven that exist — never an empty document | ledger 179 / parent brief |
| 31 | `--help` is the FLAG reference (flags, refusals, one example). `docs` is the role-scoped MANUAL. `docs` is not a second copy of `--help` | ledger 179 |
| 32 | No prose may read as though a capability the tool lacks works today | parent brief |

---

## 2. The rule for capabilities the spec describes and the tool lacks

**Six of twenty-three step verbs exist** (`goto`, `waitFor`, `click`, `type`, `screenshot`, `eval`) and **three of
thirteen calls do not** (`capacity`, `prune`, `docs` itself). `look` — the one that reads a page — is not built.

**THE RULE, applied identically to all seven scopes:** every line that names a capability the tool does not have today
ends with the literal marker `NOT BUILT YET.`, followed where possible by the fallback that IS callable. A line with no
marker is callable today. The `about` preamble states that rule once, so no reader has to infer it.

**Why this rule and not the alternatives.**

- **Omitting the unbuilt entirely** would gut the teaching. The ladder is the clearest case: four of its five rungs are
  unbuilt, so an omitting `walking` scope would carry one rung — `eval` — and a session taught only `eval` reaches for
  it for every reading, which is precisely the founding-rule breach spec 661–665 warns about ("a session can compute a
  verdict inside the page and hand it back as a value"). The same holds for the three reset levels and for `health`:
  the RULE is durable even where the implementation is absent.
- **A stated horizon** ("lands in chunk 5") is a promise this manual cannot keep, and goes stale the day a chunk lands.
- **The marker** is the only option that is honest in both directions at once. It tells a session that the capability
  exists IN THE DESIGN — so it neither invents a workaround nor reports the gap as a defect in the app (spec 1269) —
  while refusing to let it call one.

Two things the marker does NOT do, deliberately: it carries no date and no chunk number, and it never appears on a line
that describes a rule rather than a call. A rule ("a snapshot covers the state subtree only") is true whether or not
the step that takes one exists.

---

## 3. The seven scopes, section by section

`about` (once per answer, whatever the scope) carries: the `dungeonmaster siegelense <call>` form and that steps are
not calls (req 1); the `NOT BUILT YET` rule (req 32); the reading-not-verdict founding rule; why this is a call and not
prompt text, naming the 50,000-character ceiling (req 23); that `--for` narrows it (req 22); and that a code-reading
role gets no scope (req 21).

### 3.1 `operating` — reqs 5, 6, 28, 29

Sections: **What this scope leaves out** (no batch vocabulary, on purpose) · **Before you open a pool** (`capacity`,
marked, with the `status` fallback; `profile` grouped by pool size) · **`cleanup` at both ends of the pass**
(staleness only, `leftAlone` is part of the answer, asset ageing marked) · **`prune` acts on ASSETS** (marked; refuses
rather than warns, names the citing file) · **`status` — the post-mortem** (the no-browsing rule, the tombstone) ·
**Reading a minion's return** (`rework` never `wall`; the four things a minion must not do; only you see the pool) ·
**Reaping rules** (three processes per instance, the leak is invisible to whoever caused it, the home goes and the
evidence stays).

**The hard constraint: not one step verb name appears anywhere in this scope, built or unbuilt.** That bans the
substrings `goto`, `waitfor`, `click`, `type`, `screenshot` and `eval` outright — so no "a number anyone typed", no
"clicking around", no "screenshots" (the repo's own word is *capture* / *shot*), and no "retrieval", which contains
`eval`. The test asserts absence against `stepStatics.verbs.all`, case-insensitively, as substrings.

### 3.2 `planning` — reqs 7, 24

Sections: **What a prelude is and what proving one means** (VERIFIED; proving costs an instance; the same
bubble-up rule binds a planner) · **Ask `capacity` first** (marked, `status` fallback) · **`profile`** (reads what was
measured, never measures on demand; grouped by pool size; keyed by content hash) · **`recipes`** (empty list is a real
answer; the book is empty and `seed` is marked; a recipe touches state, never a screen) · **Name what the prelude
carries** (testIds and `within`, never refs; the four boundaries; a stored ref drives the wrong thing and returns a
clean-looking result) · **What a plan can promise today** (the six verbs; nothing reads a page).

### 3.3 `walking` — reqs 8, 9, 10, 24, 25, 26, 27, 29

Sections: **Read this first** (the tool cannot read a page; plan around testIds you were given) · **The ladder** ·
**The reading rules** (three outcomes; the near-miss list is today's only discovery route; the same-`within` dead end)
· **Refs are for DRIVING, selectors for RECORDING** · **The verbs you can submit today** (six, with shapes) · **What a
batch returns, and where the payloads are** (`run` status vs `results` payloads; per-step attribution; zero exchanges
is a finding) · **`stopOn` and `expect`** · **When your instance dies under you**.

The ladder section's first line is the RULE — *reach for the key first; `dom` is the hatch, last, and always with a
narrow target* — followed by the five rungs in the spec's own cheapest-first order, each marked for availability, with
`dom`'s three guards on its own rung and `eval` named as a different hatch carrying a different risk.

### 3.4 `attacking` — reqs 11, 12, 13, 14

Sections: **Read this first** (`health`, `reset` and `snapshot` all marked; today an attack that changes state needs
its own instance) · **`health`** (the verdict line; blankness twice, asked-for and unasked; marked, with the by-hand
equivalent through `results` that IS callable) · **The three reset levels** (the three layers; the middle row bites;
the level table; the state-subtree boundary; a reset reports the diff it undid; declare your level; the two
constraints on `instance`) · **`expect: 'error'`** (per-step, not batch-wide; a step expecting failure that succeeds
is itself a finding) · **Baselines** (how you actually get them; tainted inverts the check; the promotion rule and its
"or before" half; sad-path baselines; transient toasts) · **Server-side failure injection** (marked; what IS drivable
through the page today).

### 3.5 `fixing` — reqs 15, 16, 27

Sections: **Steps 1 to 4 start nothing** (with the four real commands and what each answers; `instanceState`, and
`pruned`/`unknown` as real answers; the no-`step`-no-`kind` stored return) · **Step 5 — reproduce on a FRESH
instance** · **Step 6 — the e2e uses the same recipes the prelude named** (marked) · **Step 7 — close what you
opened** · **What a fixer must not do, and the cautious mistake**.

### 3.6 `driving` — reqs 17, 18

Sections: **Who this is for** · **Five things true of you and of no dispatched role** · **The surface, in your order**
· **What you cannot do yet**.

The spec's table at 2398–2402 has **five** rows, not four (the brief's count is one short): `capacity` first and
`start` queues · `kill` is yours and nothing else will · where the evidence went, and that there is no LOOKUP ·
`unowned/` and ageing out · `cleanup` is safe for you. All five ship as five explicit lines in one section, asserted
verbatim.

### 3.7 `operational` — reqs 19, 20

Sections: **What this scope is** (no screen; siege is the only track) · **The browserless lane spec**
(`dungeonmaster-headless`; browser steps error by NAME — this half is BUILT; the shipped specs still name this repo's
own packages) · **The steps a flow with no screen uses** (`request`, `file`, `until { file }`, `until { response }`,
`storage` — all marked, with `storage` noted as browser storage so `file` is the durable read) · **`results { kind:
'server' }` — the reading nothing else surfaces** (BUILT; console is browser-only; per-step attribution) ·
**Attacking a flow with no screen** · **What is missing before this scope is usable**.

---

## 4. Build list

Folder type in brackets. Every path is inside the owned set.

| File | Folder type |
|---|---|
| `packages/siegelense/src/statics/docs/docs-statics.ts` (+ `.test.ts`) | statics |
| `packages/siegelense/src/contracts/docs-scope/docs-scope-contract.ts` (+ `.test.ts`, `docs-scope.stub.ts`) | contracts |
| `packages/siegelense/src/contracts/docs-args/docs-args-contract.ts` (+ `.test.ts`, `docs-args.stub.ts`) | contracts |
| `packages/siegelense/src/contracts/docs-answer/docs-answer-contract.ts` (+ `.test.ts`, `docs-answer.stub.ts`) | contracts |
| `packages/siegelense/src/transformers/docs-args-parse/docs-args-parse-transformer.ts` (+ `.test.ts`) | transformers |
| `packages/siegelense/src/transformers/docs-answer-compose/docs-answer-compose-transformer.ts` (+ `.test.ts`) | transformers |
| `packages/siegelense/src/transformers/docs-answer-render/docs-answer-render-transformer.ts` (+ `.test.ts`) | transformers |
| `packages/siegelense/src/responders/siegelense/docs/siegelense-docs-responder.ts` (+ `.proxy.ts`, `.test.ts`) | responders |

**No broker.** `docs` reads no I/O: the manual is immutable data, and turning a scope name into a document is a pure
transformation, which is a transformer by definition. The precedent in this package is exact — `--help` is
`siegelenseHelpStatics` → `siegelenseHelpRenderTransformer` → the flow, with no broker between them. A
`docsReadBroker` that only forwarded to the compose transformer would be indirection with nothing in it.
`brokers/docs/**` is left empty.

**Shapes.**

- `docsScopeContract` = `z.enum(siegelenseCallStatics.docs.scopes).brand<'DocsScope'>()`, the same derive-from-statics
  pattern `stepVerbContract` uses, so the seven live in one place.
- `DocsArgs` = `{ scope: DocsScope | null; human: boolean }`. `null` is the whole surface.
- `DocsAnswer` = `{ requested: DocsScope | null; about: ContentText[]; scopes: DocsScopeDocument[] }`, where a document
  is `{ scope, audience, summary, sections: { heading, lines }[] }`. Prose is `contentTextContract` throughout, the
  same branded string `leftAloneContract.why` uses.

**`--human`: yes.** JSON stays the default, so `docs` answers in the same shape as every other call and a session can
address one section rather than one blob; `--human` renders the reading copy for a person, or for a session that wants
the manual as prose rather than as escaped strings. That choice is what `status`, `cleanup` and `recipes` already do,
and `SiegelenseFlow` derives `--human` support from the help entry's own flags, so declaring `HUMAN_FLAG` in
`siegelenseHelpStatics.calls.docs.flags` is the whole wiring.

**Refusals** live in `docsArgsParseTransformer`: an unknown `--for` value refuses naming the value AND listing the
seven scopes; `--for` with no value refuses naming `--for`; an unknown flag and a positional each refuse with the
accepted set and the usage line, matching `recipesArgsParseTransformer`'s shape.

---

## 5. Test list

Assertions are on CONTENT. No test counts sections or measures length.

**`docs-statics.test.ts`**
1. Every scope pinned in `siegelenseCallStatics.docs.scopes` has its own audience line — the seven mapped and
   asserted as one complete array, which proves presence, content and order together.
2. **`operating` holds no step verb name at all** — the whole scope flattened to JSON and lowercased, with
   `stepStatics.verbs.all` filtered against it and asserted `toStrictEqual([])`, so a failure names the leak.
3. `walking`'s ladder section, asserted as a complete `{heading, lines}` object: the rule line first, then the five
   rungs cheapest-first.
4. `walking` opens by saying the tool cannot read a page, and carries `dom`'s three guards including the cap.
5. `driving` carries all five rows of the spec's table, asserted as a complete `{heading, lines}` object.
6. `about` names the 50,000-character ceiling, the `NOT BUILT YET` rule, and the absent code-reader scope —
   asserted as the complete array.
7. One headline rule per remaining scope, each asserted as an exact full line: `fixing`'s start-nothing sentence,
   `attacking`'s three reset levels and its callable stand-in for `health`, `planning`'s six-built-verbs line, and
   `operational`'s error-by-name rule and its closing admission.

**`docs-scope-contract.test.ts`** — parses each of the seven; refuses `'reader'`.

**`docs-args-contract.test.ts`** — the two fields; `.strict()` refuses an extra key; `scope: null` parses.

**`docs-answer-contract.test.ts`** — a full document parses; `.strict()` refuses an extra key on the answer and on a
section; `requested: null` parses.

**`docs-args-parse-transformer.test.ts`**
1. `[]` → `{ scope: null, human: false }`.
2. `['--for', 'walking']` → `{ scope: 'walking', human: false }`; `it.each` over all seven.
3. `['--human']` → `human: true`.
4. **`['--for', 'reader']` refuses naming `reader` AND listing the seven** — the message asserted in full.
5. `['--for']` with no value refuses naming `--for`.
6. `['--for', '--json']` refuses naming `--for` (the next token is a flag, not this flag's value).
7. `['--bogus']` refuses with the accepted set and the usage line.
8. `['walking']` positional refuses.

**`docs-answer-compose-transformer.test.ts`**
1. `{ scope: null }` → `requested: null` and all seven documents, in order.
2. `{ scope: 'fixing' }` → `requested: 'fixing'` and exactly that one document, its first section asserted in full.
3. `about` is carried whatever the scope.

**`docs-answer-render-transformer.test.ts`** — one scope rendered, asserted as the exact string.

**`siegelense-docs-responder.test.ts`** — proxy spies `process.stdout.write` only (there is nothing to mock; the
transformers run real, so these assertions are on real manual content).
1. `{ scope: null, human: false }` writes one JSON document, and its second line is `  "requested": null,`.
2. `{ scope: 'operating', human: false }` writes one document, naming it in `requested`.
3. `{ scope: 'driving', human: true }` writes TEXT — line 0 is `ABOUT` — and the driving table's heading and first
   row reach stdout verbatim on their own lines.
4. returns `{ success: true }`.

---

## 6. Wiring left to the coordinator

`tmp/siegelense-wiring/docs.md` carries the import lines, the `CALL_ROUTES` entry (last, in the spec's own call
order), the complete `calls.docs` help entry (last), the `--human` decision, the flow-level integration cases, and the
list of passages describing `capacity` and `prune` — both built in parallel by other agents, and both described here
from the spec rather than from their in-flight code.
