# 04 — the family graph

```
GOAL      Which family runs after which is DATA with routes, not an ordered array.
AFTER     nothing (independent of 01–03)
BEFORE    06 · 16 · 22
PACKAGE   @dungeonmaster/shared
MODEL     opus — this grammar is what the whole epic is written against
```

---

## What it replaces, and why an array cannot do the job

`questTypeRegistryStatics` holds two ordered arrays per quest type — `startImplementationOps` and
`relayTail` — and `questBuildRelayGraphBroker` mints every scope from them at Start.

An array says "then, then, then". It cannot say **"if this family ends `empty`, skip the next one"**,
and it cannot express a back-edge at all. Today the `empty` case exists anyway, buried inside the
fan-out: flowrider only covers flows with a UI, so a quest with none seeds no flowrider scope. Declared
as a route, that reads as a decision rather than an accident.

**This pass declares no cycle and builds none.** The grammar can express one — a `siegemaster` route
back to `codeweaver` would be a config edit, not a code change — and being able to express it is the
point of the shape. Nothing triggers it yet: a scope only ever ends at `@done` or `@blocked`, so no
family can currently produce an outcome a back-edge would fire on. Until then the family graph is
acyclic and needs no family-level `maxVisits`; the STEP graphs in story 05 have the cycles.

---

## BUILD

New: `packages/shared/src/statics/quest-flow/quest-flow-statics.ts`

**Every family entry needs `role` and `text`, not just `routes`, `fanOutBy` and `locked`.** Verified
by reading `packages/shared/src/contracts/operation-item/operation-item-contract.ts:26-33` —
`role: workItemRoleContract` and `text: z.string().min(1).brand<'OperationText'>()` are BOTH
required, no `.optional()`. Story 16 mints a family's scope (an `operationItemContract`) when that
family is routed to — read `quest-build-relay-graph-broker.ts` before writing story 16's brief; it is
the exact shape story 16 has to reproduce, and today it builds every `operationItemContract` from
`role: seed.role` and `text: slice.text` off `questTypeRegistryStatics`
(`quest-build-relay-graph-broker.ts:95-96`, `:135`). `questFlowStatics` is what replaces
`questTypeRegistryStatics`, so the family graph is where those two values have to live now, or story
16's minter has nothing to write the moment story 24 deletes the old registry.

**`wardMode` does NOT need to ride along.** Today `role: 'ward'` plus `wardMode: 'committed'` vs.
`wardMode: 'full'` is what tells two DIFFERENT relay-tail seeds apart, because both share `role:
'ward'`. Under the new design that ambiguity does not exist at the family-graph level at all: the
per-family "ward these files" step is no longer a family-level scope — it is the `ward` STEP inside
each code-changing family's own `CLOSE_OUT` (story 05, `args: ['--committed', '--uncommitted']`).
`wardFull` is the ONLY family in `questFlowStatics` whose `role` is `'ward'`. So no field is needed to
disambiguate it from anything else in this graph — decided here, not left open, because `wardMode`
is itself deleted by story 24 and a story 04 that depended on it would need touching again later.

```ts
export const questFlowStatics = {
  feature: {
    intakeSlashCommandFileName: 'dumpster-create.md',
    initialWorkItemRole: 'chaoswhisperer',
    entry: 'riftcarver',
    families: {
      riftcarver:  { role: 'riftcarver', text: 'Riftcarver: carve the quest branch, worktree and preflight typecheck',
                     routes: { done: 'codeweaver',  wall: '@blocked' } },
      codeweaver:  { role: 'codeweaver', text: 'Codeweaver: build this slice',
                     fanOutBy: 'implementation', locked: false,
                     routes: { done: 'flowrider',   empty: 'flowrider',   wall: '@blocked' } },
      flowrider:   { role: 'flowrider', text: 'Flowrider: author the test suites that prove this flow',
                     fanOutBy: 'flow',
                     routes: { done: 'siegemaster', empty: 'siegemaster', wall: '@blocked' } },
      siegemaster: { role: 'siegemaster', text: 'Siegemaster: manual-QA this flow and review its test suite',
                     fanOutBy: 'flow',
                     routes: { done: 'wardFull',    empty: 'wardFull',    wall: '@blocked' } },
      wardFull:    { role: 'ward', text: 'Ward gate (full monorepo)',
                     routes: { done: '@complete',   wall: '@blocked' } },
      // No inbound route, and exempt from story 06's reachability check.
      // Appended at merge time by OrchestrationMergeResponder, on a quest that
      // already reached @complete or blocked. NO `text` here — see "warpgate is the
      // one exception" below.
      warpgate:    { role: 'warpgate', appendedAtMerge: true, routes: { done: '@complete', wall: '@blocked' } },
    },
  },
  'bug-hunt': { /* identical families; only the intake differs */ },
} as const;
```

Every `text` value above is copied VERBATIM off today's `questTypeRegistryStatics`
(`quest-type-registry-statics.ts:65,71,84,93,99` for `feature` — `bug-hunt`'s are byte-identical,
which is the property the DONE WHEN table already pins) — this is a rename of where the sentence
lives, not a rewrite of it. `wardFull`'s text is the tail's SECOND ward seed
(`quest-type-registry-statics.ts:99`, `'Ward gate (full monorepo)'`), not the first (`'Ward gate
(committed files)'`, which has no family of its own any more — see the wardMode note above).

**`warpgate` is the one exception: it carries no `text` field.** Today's registry does not seed
warpgate's text either — `warpgateOperationStatics.ts` exists FOR EXACTLY THIS REASON, with its own
header explaining why: *"A merge is appended to the operations ledger at the user's request, at merge
time — not seeded from `questTypeRegistryStatics` like every relay-tail item... The warpgate operation
item's text has no home in that registry, so it lives here instead."* `OrchestrationMergeResponder`
reads `warpgateOperationStatics.text` directly when it appends warpgate's scope; it does not go
through story 16's lazy-scope minter at all (warpgate is `appendedAtMerge: true`, with no inbound
route, precisely so nothing else ever routes to it). `role: 'warpgate'` is carried anyway for
structural consistency, in case a generic reader ever wants every family's role uniformly.

**Three things in that block are load-bearing:**

| | |
|---|---|
| `entry` | replaces "the first element of the array" |
| `fanOutBy` | unchanged from today — `'implementation'` is per (package, flow) CELL, `'flow'` is per flow. The fan-out RULE does not change in this epic |
| a family's `done` fires when **every** one of its fanned-out scopes is complete | codeweaver with nine cells routes to flowrider ONCE, on the ninth |

**`ward(committed)` leaves this list and `wardFull` joins it.** Today one `ward(committed)` sits
between families in the relay tail. After story 20 each code-changing family ends with its own commit
and branch ward, and `wardFull` — a bare whole-monorepo run — becomes the last family before
`@complete`.

---

## DONE WHEN

New colocated test: `packages/shared/src/statics/quest-flow/quest-flow-statics.test.ts`. Its
predecessor, `quest-type-registry-statics.test.ts`, has nine `it`/`it.each` blocks — read it fully
before writing this one. It stays untouched (see the last row below); this new file is a SEPARATE
test, not an edit of it. Here is how each of its properties translates:

| Old test's property | Translates to |
|---|---|
| full-value `toStrictEqual` snapshot of the whole registry | the same, on `questFlowStatics` |
| `initialWorkItemRole` per type (`chaoswhisperer` / `bughunt`) | unchanged — the field survives verbatim, assert it the same way |
| every intake role is a chat role (`workItemRoleStatics.chat`) | unchanged — same assertion, same field |
| every `relayTail` role is one of that type's declared `roles` | **does not translate.** `questFlowStatics` carries no top-level `roles` list — the family KEYS themselves are what a caller now enumerates. The nearest analog is already a DONE WHEN row here: "every route target is either a family key in the same object, `@complete`, or `@blocked`" |
| every declared role is a known `workItemRoleContract` name | **does not translate cleanly, and is an OPEN question — for the conductor.** `riftcarver`, `codeweaver`, `flowrider`, `siegemaster` and `warpgate` are all real `workItemRoleContract` members, but `wardFull` (the family KEY) is not — its `role` field is `'ward'`, which IS a member. Decide whether the new test asserts `Object.values(families).map(f => f.role)` against `workItemRoleContract` (which holds, since it reads `.role` not the family key) or drops this check as redundant with contract validation |
| declares a fan-out on exactly the two tail operators (`flowrider`, `siegemaster`) | **the count changes to THREE: `codeweaver`, `flowrider`, `siegemaster`.** Under the old array split, codeweaver's fan-out lived in a separate `startImplementationOps` list the old test never scanned for `fanOutBy`. Under the new single `families` object all three code-changing families sit together, so the equivalent assertion is `Object.entries(families).filter(([, f]) => 'fanOutBy' in f).map(([k]) => k)` equals `['codeweaver', 'flowrider', 'siegemaster']` |
| riftcarver seeds FIRST | becomes `entry: 'riftcarver'` — a direct field read, no scan needed |
| the riftcarver seed declares neither `fanOutBy` nor `locked` | unchanged in spirit — assert the `riftcarver` family object has neither key |
| both quest types seed identical implementation ops, tail and roles | becomes "both quest types hold identical `families` objects" — already a DONE WHEN row below |

| Assert | |
|---|---|
| the statics pins, and `feature` and `bug-hunt` hold IDENTICAL family sets | today's `questTypeRegistryStatics` test already asserts that equality for the arrays. Keep the property |
| every route target is either a family key in the same object, `@complete`, or `@blocked` | a typo here is a quest that silently stalls. Story 06 checks this properly; assert the obvious form now |
| every family entry carries a non-empty `role` and a non-empty `text` — except `warpgate`, which carries `role` and no `text` | `operationItemContract` requires both; a missing one here is caught in story 04 rather than twelve stories later in story 16 |
| `wardFull` is the only family whose `role` is `'ward'` | confirms the "no `wardMode` needed" decision actually holds for this graph |
| `questTypeRegistryStatics` is UNCHANGED and its test still passes | its callers are live until story 24 |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| touch any CALLER of `questTypeRegistryStatics` | story 22. **The caller list in this story's own earlier draft was wrong** — checked against `24-the-deletions.md`'s own corrected count: there is exactly ONE caller outside `@dungeonmaster/orchestrator` (`packages/web/src/flows/home/bughunt-begin-transition.e2e.ts`, not "four web e2e specs"), and the in-package callers are `quest-create-broker.ts`, `chat-start-responder.ts` AND `quest-user-add-broker.ts` (missing from the original list). Two more callers are `shared` itself — `contracts/quest-type/quest-type-contract.ts:12` and `guards/is-chat-work-item-role/is-chat-work-item-role-guard.ts:16`, both comment references only. Read story 24's own "every caller, and the story's own count was wrong" section for the full, verified table rather than re-deriving it |
| delete `questTypeRegistryStatics` | story 24 |
| write the reachability check | story 06 |
| write the step graphs | story 05 |
