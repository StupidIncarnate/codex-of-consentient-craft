# Recipes build — handoff

**Branch `recipes-doc`, worktree `worktrees/recipes-doc`. Work only there.**

The framework is built and runs. This repo's ingredients exist and make real state. The conversion
has started. **Master has moved and is NOT merged yet** — that is the first job.

---

## Do these first, in this order

### 1. Finish the interrupted round

Commit `583cde7ed` was taken **mid-round, before a ward sweep**, deliberately, so nothing sat
uncommitted. An agent was still editing the quest status allowlist when it landed.

```bash
npm run ward -- --committed --uncommitted
```

`timeout: 600000`. **Two known failures, both one line, both in files nobody edited:**

```
packages/siegelense-recipes/src/brokers/guild/api-route/guild-api-route-broker.proxy.ts
packages/siegelense-recipes/src/brokers/quest/api-route/quest-api-route-broker.proxy.ts
  @dungeonmaster/enforce-proxy-child-creation ... dmHttpResponseUnwrapAdapter ...
```

Both api-route brokers gained a call to the adapter that unwraps an HTTP envelope into the record the
runner expects, and neither proxy composes that adapter's proxy. **A fix was dispatched and may
already be on disk — check before repeating it.**

**This is the second time this rule has caught a real gap** that no file-scoped run would show, because
the breakage lands one file away from its cause. **Run the package-wide lint, not just the files you
touched.**

### The interrupted work, which DID land

The quest ingredient's `to` list now reads from a dedicated statics file rather than a filter, so
`set({ status: 'blocked' })` fails to compile again — the guarantee the specification states outright.

**The narrow route was chosen deliberately.** That lint rule's allowlist is checked once per FILE, so
allowlisting the ingredient would have disabled it for every line of that file. A statics file whose
only export is one array keeps the exemption to one declaration.

**And the fixture proving that rule was green for the wrong reason.** It graded a stand-in ingredient
that already wrote its list inline, so it never exercised the conflict. A new fixture imports the real
quest ingredient and was proven both ways — the refusal fires now, and with the old filtering restored
it produced zero diagnostics.

**Re-ask that question of the rest of the suite.** If one fixture graded a stand-in nobody uses,
others may too, and the negative suite would then prove its rules only for ingredients nobody relies
on.

**One more conflict to expect:** a `const`-bound array of statuses is exempt from `enforce-magic-arrays`
only in `statics/`, a stub, a proxy or a test — and `ban-quest-status-literals` had no allowlist entry
for a statics folder holding an ingredient's own transition list. **Every future ingredient declaring
`transitions` hits this same dead end** and needs its own narrowly-scoped entry, following the pattern
now established.

### 2. Merge master

```bash
git merge master
```

**12 commits, 206 files.** Then sweep again. **Never merge on a red tree.**

**Two things in it matter more than their size:**

**The siegelense interface is now the CLI, and the MCP layer is gone** (`8d4994c41`, `71629e126`).
The recipe book's Part 6 describes `recipes {}` and the `seed` step as MCP tools registered as
`siegelense-<name>`, with a thirteen-tool table. **That surface no longer exists.** Chunk 8 cannot be
planned against it, and the document is now wrong about the tool it integrates with. Treat it as a
finding: state what is true, keep the requirement, record why it changed.

**`packages/web/playwright.config.ts` and the e2e global setup changed.** Those files set
`DUNGEONMASTER_HOME` at module scope, and that is **the only reason a `write` route works inside a
spec worker**. A refactor moving those lines breaks every write route with no other symptom. Check
the merge against exactly that before trusting any browser-spec work.

### 3. Then reassess chunk 8 before planning it

---

## Where things are

| Package | State |
|---|---|
| `@dungeonmaster/hydration` | **Built.** Contracts, chain, runner, transitions, filter, sad paths, both halves of the negative type suite, the public barrels |
| `packages/siegelense-recipes` | **Built.** Five ingredients, a registry, three recipes, route brokers. Does NOT ship — absent from root `dependencies`, marked private, both pinned by a test |
| `@dungeonmaster/eslint-plugin` | Two new rules: no DOM handle in an ingredient, no clock or random source |
| `packages/siegelense` | **Untouched.** Chunk 8 |

**Commits:** `0dcd4522d` (contracts, errors, type harness) · `699ec52a2` (chain, registry, reference
grammar) · `583cde7ed` (runner, ingredients, recipes, conversion start).

---

## Chunk status

| # | Chunk | State |
|---|---|---|
| 1-3 | contracts, declaration, chain | **Done** |
| 3b | typed plan output | **Not started.** Scheduled, with an abort condition, in the chunk 1-3 plan §12 |
| 4 | runner and pre-flight | **Done** |
| 5 | transitions and `reach` | **Done.** The quest ingredient walks its status |
| 6 | filter and `fromSaved` | **Done** |
| 6b | sad paths driven for real | **Mostly.** Audit in the agent record: most rows driven against real sockets, servers and denied writes. Two cannot be driven here — a gate refusing (the framework owns no gates) and a transaction rolling back (needs a real database and a consumer wrapper) |
| 7 | this repo's ingredients | **Done**, except session/sub-agent `copies:` — see open decisions |
| 8 | siegelense listing and `seed` | **Blocked on you, and on the CLI change above** |
| 9 | integration conversion | **One file converted.** The rest are descoped — see the cycle below |
| 10 | browser conversion | **Planned, not started.** Plan rewritten around the harness seam |
| 11 | manual siegelense round | Needs chunk 8 |
| 12 | combinatorial rounds | **One round run.** 65 cases planned; the tier-1 cases are done and found three real defects |

---

## Open decisions — yours

### 1. Chunk 8

Edits `packages/siegelense`, where manual rounds land fixes. Your brief says ask first. **Now also
needs re-planning against the CLI surface**, since the MCP tools the spec describes are gone.

### 2. `copies:` for the session ingredient

A write route **must** declare `copies:` — the production code whose output it imitates. **Nothing in
this repo writes a session transcript;** the Claude CLI does. An agent shipped
`copies: 'claude-mock/bin/claude'`, pointing at a **test fixture**, which is the compromise I had
explicitly told an earlier agent not to invent.

Either the rule admits an external producer, or that ingredient cannot declare a write route — which
shuts a large share of session seeding out of the cheap no-server environment.

---

## Rulings already made — do not re-litigate

Each is recorded with its reasoning in the plan docs' rulings and amendments sections.

| Ruling | Where |
|---|---|
| `routes` gains optional `query`, `update`, `remove` — the chain has four verbs acting on rows a plan did not create | chunk 4-6 plan §5 |
| An extra is `{ args, apply }`; `reach` receives the record; a link carries an optional `from` | same |
| `api` wins over `write` when both are declared and a base URL exists | same |
| A filter's scope is its immediate host | same |
| A forward `fromSaved` is caught in the pre-flight, not the builder | same |
| A saved record is a **snapshot at save time**, not a live view | spec, beside `saveRecordAs` |
| The orchestrator-owned integration targets are **descoped** — duplicating ingredients to dodge the cycle is rejected | spec, migration section |
| The compiler suites stay split, one program per suite at module scope | chunk 1-3 plan §10b |

---

## Traps — each cost an agent a cycle

| Trap | What happens |
|---|---|
| **A route can escape the target** | Several of this repo's brokers resolve their home from the global `DUNGEONMASTER_HOME`, never the target handed to them. A plan can write somewhere the caller never named. Harnesses set the env for this reason. The isolation the design promises holds only while every route honours its target |
| **`instanceof` fails across test realms** | An error made by node's own machinery is not an `Error` to a test file's check — each test file gets its own constructor. Walk a cause chain by SHAPE (`typeof`, `in`), never `instanceof`. Two agents collided over this |
| **A test under `test/` never runs** | This package's jest config scopes `roots` to `src`. A suite there is silently skipped, not failed. Suites live under `src/`; fixtures and harnesses under `test/` |
| **Neither tsconfig may carry a comment** | Ward parses `tsconfig.json` as strict JSON and its `catch` swallows the failure, silently discarding the file's real `include`/`exclude`. Verify with `python3 -c "import json; json.load(open(...))"` |
| **A contract's test proves nothing about its generic** | Three bugs shipped green because their tests exercised the runtime zod schema and never the type parameters. The proof is a real call site compiling |
| **`registry()` and `run()` must come from ONE factory call** | Registered ingredients are closure state. A runner from a fresh call sees none, and fails naming a route that genuinely is declared |
| **A config entry naming an unregistered lint rule is FATAL** | It takes down linting for the whole package. The rule ships first, the config names it second |
| **`require-zod-on-primitives` is a different rule from `ban-primitives`** | The package carve-out covers only the second. `ban-primitives` also rejects a bare `number` in a type-only position |
| **`enforce-stub-usage` flags ANY object literal bound to a `const` in a test** | Including an ad-hoc fixture array with no contract. Inline it as a call argument, or populate via calls |

---

## What the last round found, unfixed

- **The migration plan's session-harness call-site figures are wrong** — `createSessionFile` is 139, not 22; `appendMainSessionLine` is 5, not 0. Hand-counted, and the script disagrees. **Batches were sized on those numbers.** Fix before cutting batches.
- **Part 6's worked example does not match the shipped recipe** — it passes a quest id to a recipe that takes a guild id and seeds a fresh quest.
- **The census still lists the orchestrator integration targets as convertible**, though the spec descopes them.
- **`under()`'s supplied values cascade to descendants now**, but a real recipe's workaround is still needed for a separate reason — a saved record is frozen at create time.

---

## The running mark

**The old one measured nothing.** `--progress` reports 916; that decomposes into import lines,
constructor calls and lifecycle hooks, and **not one is a seeding call**. It cannot fall under any
conversion shape.

**Use `--methods`:**

```bash
python3 scrolls/tools/seed-census.py --methods
```

Per harness method: call sites, whether the body reaches the framework, and **whether it still writes
directly**. Finished means that last column holds nothing the migration plan does not name to stay
raw. Today: **32 methods write directly, none route through the framework.**

---

## Documents, and which is authoritative

| File | For |
|---|---|
| `siegelense-recipes.md` | **The specification.** Part 5 wins over Part 3A. Carries every finding written back |
| `recipes-ledger.md` | The running mark of covered versus not — **64 rows**, keyed to spec headings |
| `plans/recipes-chunk-01-03-framework-types.md` | Contracts and chain. **§10b amendments** records where the plan was wrong |
| `plans/recipes-chunk-04-06-runner.md` | Runner, transitions, filter, sad paths. **§5 rulings** |
| `plans/recipes-chunk-07-repo-ingredients.md` | This repo's ingredients. **§0b** records what building found |
| `plans/recipes-chunk-09-10-migration.md` | The conversion, rewritten around the harness seam |
| `plans/recipes-chunk-12-combinatorial-rounds.md` | 65 numbered cases, rounds A-D |
| `plans/recipes-seeding-survey.md` | What the real harnesses do, with file-and-line evidence |

**`scrolls/seigelense/proto/` is deleted.** The document's examples are re-sourced from
`packages/hydration/test/type-fixtures/positive/every-chainable.ts`, which a real compiler grades.

---

## How this build has been working, and why

**Every agent verifies rather than trusts.** Plans were wrong about something in nearly every group,
and each defect was caught by an agent checking a cited fact against real code instead of following
it. Keep that.

**Prove a test can fail.** Three separate green-but-worthless tests were caught this way — one
asserting a key that could never exist, one grading fixtures nobody uses, one never run at all.

**A finding goes into the document, not around it.** That is the specification's own rule and it is
the reason the doc is now worth more than when this started.
