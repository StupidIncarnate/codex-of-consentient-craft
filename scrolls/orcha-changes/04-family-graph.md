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

```ts
export const questFlowStatics = {
  feature: {
    intakeSlashCommandFileName: 'dumpster-create.md',
    initialWorkItemRole: 'chaoswhisperer',
    entry: 'riftcarver',
    families: {
      riftcarver:  { routes: { done: 'codeweaver',  wall: '@blocked' } },
      codeweaver:  { fanOutBy: 'implementation', locked: false,
                     routes: { done: 'flowrider',   empty: 'flowrider',   wall: '@blocked' } },
      flowrider:   { fanOutBy: 'flow',
                     routes: { done: 'siegemaster', empty: 'siegemaster', wall: '@blocked' } },
      siegemaster: { fanOutBy: 'flow',
                     routes: { done: 'wardFull',    empty: 'wardFull',    wall: '@blocked' } },
      wardFull:    { routes: { done: '@complete',   wall: '@blocked' } },
      // No inbound route, and exempt from story 06's reachability check.
      // Appended at merge time by OrchestrationMergeResponder, on a quest that
      // already reached @complete or blocked.
      warpgate:    { appendedAtMerge: true, routes: { done: '@complete', wall: '@blocked' } },
    },
  },
  'bug-hunt': { /* identical families; only the intake differs */ },
} as const;
```

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

| Assert | |
|---|---|
| the statics pins, and `feature` and `bug-hunt` hold IDENTICAL family sets | today's `questTypeRegistryStatics` test already asserts that equality for the arrays. Keep the property |
| every route target is either a family key in the same object, `@complete`, or `@blocked` | a typo here is a quest that silently stalls. Story 06 checks this properly; assert the obvious form now |
| `questTypeRegistryStatics` is UNCHANGED and its test still passes | its callers are live until story 24 |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| touch any CALLER of `questTypeRegistryStatics` | story 22. There are callers in `orchestration-start-responder`, `chat-start-responder`, `quest-create-broker`, and four web e2e specs — and those e2e specs read the registry DELIBERATELY, so a seeded relay is checked against real data rather than an assumption |
| delete `questTypeRegistryStatics` | story 24 |
| write the reachability check | story 06 |
| write the step graphs | story 05 |
