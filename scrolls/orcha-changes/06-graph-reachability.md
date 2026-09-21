# 06 — the graph is checked before it runs

```
GOAL      A graph that cannot work is refused at author time, in the editor, naming the
          offending step — and refused again at server load, because lint can be bypassed.
AFTER     04 (family graph) · 05 (step graphs)
BEFORE    nothing depends on it. It is a safety net, and it is here because a bad graph
          committed now is a stall discovered in story 22.
PACKAGE   @dungeonmaster/local-eslint + wherever the server loads statics
MODEL     sonnet
```

---

## Why this is a real story and not a nice-to-have

A config this shape has a failure mode a type cannot catch: **a step or family that no route reaches,
or that reaches no end.** The evidence is not hypothetical — the author of the design left the `ward`
step disconnected in a draft and it read as fine to three passes of review.

The failure mode in production is a quest that **silently stalls** rather than one that errors. No
exception, no log line, no red. A work item sits `pending` forever and the panel looks normal.

---

## BUILD

**One implementation, two callers.** Write the walk once, as a transformer or guard that takes a graph
and returns the violations. Then call it from a lint rule AND from server load. Duplicating the walk
is how the two drift.

### The eight rules

| Rule | Catches |
|---|---|
| every step is reachable from `entry`, **or declares `mintableOnRequest`** | a step nothing routes to — a dead prompt, never dispatched |
| every step reaches a terminal | a cycle with no exit — the quest runs forever |
| every route target names a real step, or `@done` / `@blocked` | a typo, or a step someone renamed |
| a step with no `done` route is reached ONLY by `unmet` or by a request | the "returns to its minter" contract. A step the plan CAN reach with no forward edge has no minter to return to, and is a stall |
| every declared outcome word is one of the four | `pass`, `green`, `rework`, `confirmed` — the vocabularies this replaces |
| a cyclic path has `maxVisits` somewhere on it | an unbounded loop |
| every family reaches `@complete`, and every family is reachable from `entry` **unless it declares `appendedAtMerge`** | the relay version of the same two rules |
| every `prompt` names a prompt that exists; every `handler` names a handler that exists | a swapped-out prompt leaving a dangling reference |

### The three legitimate exemptions

A naive version of rule 1 fails all three, and all three are correct. **Each is a DECLARED FLAG on the
config, never an exception inside the checker** — so the config says why, and the checker stays dumb:

| | Flag | Why it is reachable |
|---|---|---|
| `recipe` | `mintableOnRequest` | a running planner or walker asks for it |
| `read` | `mintableOnRequest` | a walker asks for a configured value mid-pass |
| the `warpgate` FAMILY | `appendedAtMerge` | it has no inbound route at all — the merge responder appends it to a quest that already reached `@complete` |

**`adversarial` is NOT on that list.** It used to be plan-minted and needed a flag; story 05 routes
`happyWalk → adversarial`, so an ordinary reachability walk finds it. If you find yourself adding a
flag to it, story 05's route is wrong.

### Where the lint rule goes

`packages/local-eslint`, beside the rules already there. This repo's own rules load from TypeScript
source and import `@dungeonmaster/shared/statics` at module load, so **the mechanism already exists** —
copy the shape of an existing rule rather than inventing one.

**One trap that will cost you a confusing hour:** ESLint sets no `source` condition, so a rule reading
`@dungeonmaster/shared/statics` reads `dist/`. If you change a value in `shared` statics and lint does
not see it, build `shared` — that is the one narrow case where lint needs a build.

---

## DONE WHEN

Eight deliberately broken fixture graphs, one per rule, each failing with a message that NAMES the
offending step or family. Then the three exemptions above, each passing. Then the real graphs from
stories 04 and 05, passing.

| Assert | |
|---|---|
| a fixture with a disconnected step fails, and the message contains that step's name | "the graph is invalid" is useless; you need to know which one |
| a fixture with `routes: { done: 'revieww' }` fails | the typo case, which is the one that will actually happen |
| a fixture with a `work ⇄ review` cycle and no `maxVisits` anywhere fails | an unbounded loop |
| a fixture declaring `routes: { pass: 'x' }` fails | the old vocabulary |
| the SAME check throws at server load, from the same implementation | assert both callers, or they drift |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| change either graph to make the check pass | if a real graph fails, that is a finding — report it, do not edit the config to suit your checker |
| validate a PLAN | story 08. This checks the CONFIG |
| add a family-level `maxVisits` | no family back-edge is declared. The day one is, that field is needed — and this check is what catches its absence |
