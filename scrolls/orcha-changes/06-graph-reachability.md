# 06 — the graph is checked before it runs

```
GOAL      A graph that cannot work is refused at author time, in the editor, naming the
          offending step — and refused again at server load, because lint can be bypassed.
AFTER     04 (family graph) · 05 (step graphs)
BEFORE    nothing depends on it. It is a safety net, and it is here because a bad graph
          committed now is a stall discovered in story 22.
PACKAGE   @dungeonmaster/shared (the contract + the walk) · @dungeonmaster/local-eslint
          (the rule) · @dungeonmaster/server (the load-time throw)
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

**One implementation, two callers.** Write the walk once, then call it from a lint rule AND from
server load. Duplicating the walk is how the two drift.

Four files, in this order:

| # | File | |
|---|---|---|
| 1 | `packages/shared/src/contracts/routed-graph/routed-graph-contract.ts` (+ `routed-graph.stub.ts`) | the input shape both graph levels satisfy |
| 2 | `packages/shared/src/transformers/graph-reachability-violations/graph-reachability-violations-transformer.ts` (+ its `.test.ts`) | the walk |
| 3 | `packages/local-eslint/src/brokers/rule/graph-reachability/rule-graph-reachability-broker.ts` | caller one |
| 4 | `packages/server/src/startup/start-server.ts` | caller two |

### Why the walk is a `transformers/` file, and why it sits in `shared`

**`transformers/`, not `guards/`**: a guard returns a boolean, and this has to NAME the offender.
A transformer is a pure function from data to data, which is exactly what a graph walk is. Precedent
for a graph walk in that folder:
`packages/shared/src/transformers/dependency-graph-find-cycle-path/dependency-graph-find-cycle-path-transformer.ts`.
Precedent for a transformer returning violations:
`packages/orchestrator/src/transformers/quest-orphan-flow-nodes/quest-orphan-flow-nodes-transformer.ts:14`
— `export const questOrphanFlowNodesTransformer = ({ flows }: { flows?: Flow[] }): ErrorMessage[] => {`.
Copy that return type; it validates each string through `errorMessageContract.parse`, which is what
`transformers/` requires of every output.

**In `@dungeonmaster/shared`**, exported from the `packages/shared/transformers.ts` barrel, because
shared is the only package all the callers already have. `packages/local-eslint/package.json`
depends on `@dungeonmaster/eslint-plugin`, `@dungeonmaster/shared` and `zod` — nothing else. Both
`orchestrator` and `server` depend on shared.

### The contract, and the one field that must stay loose

`transformers/` forbids inline types — every type comes from `contracts/` — so the node shape is a
real contract rather than a `type` alias in the transformer:

```ts
// packages/shared/src/contracts/routed-graph/routed-graph-contract.ts
export const routedGraphNodeContract = z.object({
  // DELIBERATELY z.record(z.string()) and NOT the four outcome words. Rule 5 exists to catch
  // `pass:` / `green:` / `rework:`. Narrow this to the union and the bad key is refused before
  // the check runs, so rule 5 could only ever fire on a fixture — never on a real graph.
  routes: z.record(z.string()),
  maxVisits: z.number().int().positive().optional(),
  prompt: z.string().optional(),
  handler: z.string().optional(),
  mintableOnRequest: z.literal(true).optional(),
  appendedAtMerge: z.literal(true).optional(),
});

export const routedGraphContract = z.object({
  graphName: z.string().min(1),
  entry: z.string().min(1),
  nodes: z.record(routedGraphNodeContract),
});

export type RoutedGraph = z.infer<typeof routedGraphContract>;
export type RoutedGraphNode = z.infer<typeof routedGraphNodeContract>;
```

The colocated stub, the repo's five-line object-stub pattern (copy
`packages/shared/src/contracts/blight-checklist-item/blight-checklist-item.stub.ts` exactly):

```ts
// packages/shared/src/contracts/routed-graph/routed-graph.stub.ts
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { routedGraphContract } from './routed-graph-contract';
import type { RoutedGraph } from './routed-graph-contract';

export const RoutedGraphStub = ({ ...props }: StubArgument<RoutedGraph> = {}): RoutedGraph =>
  routedGraphContract.parse({
    graphName: 'codeweaver',
    entry: 'plan',
    nodes: { plan: { routes: { done: '@done' }, maxVisits: 5 } },
    ...props,
  });
```

Export both the contract and the stub from `packages/shared/contracts.ts`. **Tests import the stub,
never the contract** — that is what `@dungeonmaster/ban-contract-in-tests` enforces everywhere but
the rule-broker tree.

### The signature

```ts
export const graphReachabilityViolationsTransformer = ({
  graph,
  terminals,
  exemptFlag,
  knownPrompts,
  knownHandlers,
}: {
  graph: RoutedGraph;
  // ['@done', '@blocked'] for a STEP graph; ['@complete', '@blocked'] for the FAMILY graph
  terminals: readonly string[];
  // which declared flag exempts a node from rule 1 AT THIS LEVEL
  exemptFlag: 'mintableOnRequest' | 'appendedAtMerge';
  knownPrompts: readonly string[];
  knownHandlers: readonly string[];
}): ErrorMessage[] =>
```

**`exemptFlag` is a parameter rather than "either flag exempts"**, and that is the difference between
a check and a rubber stamp: a STEP that declared `appendedAtMerge` would otherwise be waved through
by a flag that only means something one level up, and a FAMILY declaring `mintableOnRequest` the same.

`terminals` differ by level for the same reason — `@done` completes an operation item, `@complete`
completes a quest. A single hardcoded pair would pass a family graph routing to `@done`, which is not
a thing.

**Rule 7 needs no separate code.** It is rules 1 and 2 run against the family graph with the other
`terminals` and the other `exemptFlag`. That is the whole reason the walk is level-agnostic.

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

**Story 05 gives the complete expected answer for the step graphs** — its "How every step is reached"
table names every step's inbound edge and the five steps that legitimately declare no `done` route.
Story 04's block gives the family one. Read them; do not re-derive them here, and do not edit either.

### The message each rule reports

**The message text lives in the transformer, not in the rule's `messages` map.** The rule declares ONE
`messageId` carrying the rendered string, and the server throws the same strings joined. Two copies of
eight sentences is exactly the drift "one implementation" exists to prevent.

Each message NAMES the offender, then the fix, then what it costs — the voice already in
`rule-no-hardcoded-package-names-broker.ts:31–35`.

| Rule | Message |
|---|---|
| 1 reachable | `Step '<step>' in the '<graph>' graph is reached by no route from '<entry>'. Route something to it, or declare mintableOnRequest: true if a running session asks for it. A step nothing reaches is a prompt that is never dispatched, and the quest that needed it stalls with no error.` |
| 2 terminal | `Step '<step>' in the '<graph>' graph reaches no terminal — every path out of it returns to a step already on the path. Give some step on that cycle a route to <terminals>, or the quest runs forever.` |
| 3 target | `Route \`<outcome>: '<target>'\` on step '<step>' in the '<graph>' graph names nothing. A target is a step key in the same graph, or <terminals>. This is the typo case, and in production it is a silent stall rather than an error.` |
| 4 no `done` | `Step '<step>' in the '<graph>' graph declares no \`done\` route but is reached by \`<outcome>\` from '<from>'. A step with no forward edge returns to whoever minted it, and only an \`unmet\` route or a request has a minter to return to. Declare a \`done\` route, or drop that inbound one.` |
| 5 vocabulary | `\`<outcome>\` is not an outcome word. Step '<step>' in the '<graph>' graph may route \`done\`, \`unmet\`, \`empty\` or \`wall\`, and nothing else. \`pass\`, \`green\`, \`rework\` and \`confirmed\` are the vocabularies this replaced.` |
| 6 bounded cycle | `The cycle <a → b → a> in the '<graph>' graph declares \`maxVisits\` on no step on it. Put one on any step in that cycle; without it nothing stops the quest re-entering it forever.` |
| 7 families | rules 1 and 2, with `<graph>` naming the quest type — `feature`, `bug-hunt` — and the offender naming the family |
| 8 dangling | `Step '<step>' in the '<graph>' graph names prompt '<prompt>', which nothing serves. Add it to agentPromptClassificationStatics.promptNames and to agentNameToPromptTransformer, or fix the name. A dangling prompt is a session dispatched against nothing.` — and the handler twin, listing the four valid handler names |

### Caller one: the lint rule

Registration here is three edits plus two companion files. Miss any one and the rule exists but never
runs.

| # | File | Edit |
|---|---|---|
| 1 | `packages/local-eslint/src/brokers/rule/graph-reachability/rule-graph-reachability-broker.ts` | `export const ruleGraphReachabilityBroker = (): EslintRule => ({ ...eslintRuleContract.parse({ meta: { type: 'problem', docs: { description }, messages: { graphViolation: '{{violation}}' }, schema: [] } }), create: (context: unknown) => { … } })`. Copy `rule-no-bare-location-literals-broker.ts` — it is the one rule that already reads statics AT MODULE LOAD (`:12` imports `locationsStatics` from `@dungeonmaster/shared/statics`, `:20` computes its set once, outside `create`) |
| 2 | `…/rule-graph-reachability-broker.proxy.ts` | the five-line companion, verbatim shape below |
| 3 | `…/rule-graph-reachability-broker.test.ts` | `const ruleTester = eslintRuleTesterAdapter();` from `@dungeonmaster/eslint-plugin`, then `ruleTester.run('graph-reachability', ruleGraphReachabilityBroker(), { valid: [...], invalid: [...] })`. `rule-ban-locator-pick-broker.test.ts:1–15` is the shape |
| 4 | `packages/local-eslint/src/responders/local-eslint/create/local-eslint-create-responder.ts` | add the key to BOTH the return type's inline record (`:19–26`) and the `rules` object (`:29–36`), and name it in the PURPOSE line at `:2` |
| 5 | `eslint.config.js` | `'@dungeonmaster-local/graph-reachability': 'error'` in **both** rule blocks — the TypeScript one at `:114–119` and the test one at `:160–165`. One alone leaves half the tree unlinted |

```ts
/**
 * PURPOSE: Proxy for the graph-reachability rule broker — present only to satisfy enforce-proxy-patterns. Tests for the rule itself use RuleTester directly.
 *
 * USAGE:
 * ruleGraphReachabilityBrokerProxy();
 *
 * WHEN-TO-USE: Companion artifact for enforce-proxy-patterns / enforce-proxy-child-creation. Not consumed by application code.
 */
export const ruleGraphReachabilityBrokerProxy = (): Record<PropertyKey, never> => ({});
```

**The rule fires on a FILENAME, and the filename is the statics file's.** A rule that reads the graph
at module load has nothing to attach a report to otherwise. So `create` returns `{}` unless the file
under lint is one of the two statics files, and returns a `Program` visitor for those — reporting one
`graphViolation` per violation on the `Program` node. Scope it the way the existing rules scope
themselves, with a path guard reading a statics file:
`packages/local-eslint/src/guards/is-ban-direct-io-scope-file/` plus
`packages/local-eslint/src/statics/ban-direct-io-in-test-scenarios/` are the pair to copy, so the two
paths live in `packages/local-eslint/src/statics/graph-reachability/graph-reachability-statics.ts`
rather than inline in the rule.

**One trap that will cost you a confusing hour:** ESLint sets no `source` condition, so a rule reading
`@dungeonmaster/shared/statics` reads `dist/`. If you change a value in `shared` statics and lint does
not see it, build `shared` — that is the one narrow case where lint needs a build.

### `OPEN` — local-eslint cannot reach `agentFlowStatics` today, and the obvious fix is worse

Half of this works out of the box and half does not:

- `questFlowStatics` (story 04) lands in `@dungeonmaster/shared/statics`, which a local-eslint rule
  already imports — `rule-no-bare-location-literals-broker.ts:12`. That half is done.
- `agentFlowStatics` (story 05) lands in `packages/orchestrator/src/statics/agent-flow/`.
  **`packages/local-eslint/package.json` does not depend on `@dungeonmaster/orchestrator`** — its
  dependencies are `@dungeonmaster/eslint-plugin`, `@dungeonmaster/shared` and `zod`. Only `cli`,
  `hydration-recipes`, `mcp` and `server` depend on orchestrator.
- And `import { … } from '@dungeonmaster/orchestrator'` is not the answer. That package's `exports`
  map carries only `.`, `./brokers` and `./testing` — there is no `./statics` subpath — and `.` is
  `src/index.ts`, which re-exports `StartOrchestrator` at `:2`. `src/startup/start-orchestrator.ts:81–103`
  runs six `Flow.bootstrap()` calls **at module top level**: real intervals and fs watchers.
  Importing that barrel from a lint rule starts them in every ESLint process, including every spawned
  hook child.

**Someone must pick one, and it is the epic author's call rather than this story's:**

| Option | Cost |
|---|---|
| add a `"./statics"` subpath to `packages/orchestrator/package.json` (source / import / require / types, mirroring the `./brokers` entry) and `"@dungeonmaster/orchestrator": "*"` to `packages/local-eslint/package.json` | a new workspace edge, and every lint run transpiles orchestrator's statics tree. Avoids the barrel and its timers entirely |
| move `agentFlowStatics` to `packages/shared/src/statics/agent-flow/`, beside `questFlowStatics` | no new edge, no new export, one import for both graphs — but it moves the file story 05 names, so story 05 moves with it |

**Until it is settled, build the contract, the walk and its fixtures, and wire the lint rule to
`questFlowStatics` alone.** The transformer takes the graph as an argument, so the step-graph caller
is one import line whichever way the decision lands.

### Caller two: server load

`packages/server/src/startup/start-server.ts`. `StartServer` already runs two side-effect bootstraps
before it builds the app — `QuestDrivenWatchersFlow.bootstrap()` at `:34` and
`OrchestrationBootFlow.bootstrap()` at `:40`. **The check goes above both, called directly, and it
throws.**

**Directly, and not wrapped in a `bootstrap()`-shaped flow**, for one reason:
`packages/server/src/flows/orchestration-boot/orchestration-boot-flow.ts` catches its own failure and
writes it to stderr. A swallowed graph failure is precisely the silent stall this story exists to
prevent — the throw has to reach the caller and stop the boot.

One fact worth having before you go looking: the MCP child loads `StartOrchestrator`, not
`StartServer` — `orchestration-boot-flow.ts`'s header says so
(*"It runs ONLY in the HTTP server process; MCP children must never normalize the shared
dispatch-state file"*).

`OPEN` — **whether a third call site belongs in `packages/orchestrator/src/startup/start-orchestrator.ts`**
so an MCP child also refuses a bad graph. The check is read-only and idempotent, so it is safe there;
the brief for this story says two callers. The epic author decides.

---

## DONE WHEN

`npm run ward -- --only lint,typecheck,unit -- <your paths>` exits 0, and:

**The eight broken graphs are TRANSFORMER tests, not rule tests.** `RuleTester` does not read files
off disk — `rule-ban-locator-pick-broker.test.ts:6` says so in as many words — so a rule that reads
its graph at module load cannot be handed a broken one through a test case. The rule's test proves
the wiring; the transformer's test proves the rules.

| Assert | |
|---|---|
| eight transformer tests, one per rule, each failing with a message that NAMES the offending step or family | "the graph is invalid" is useless; you need to know which one |
| a graph with a disconnected step fails, and the message contains that step's name | |
| `routes: { done: 'revieww' }` fails, and the message contains `revieww` | the typo case, which is the one that will actually happen |
| a `work ⇄ review` cycle with `maxVisits` on NEITHER fails; the same cycle with `maxVisits` on ONE of them passes | an unbounded loop — and the passing half is what stops the rule demanding the field on every step |
| `routes: { pass: 'x' }` fails | the old vocabulary. **This is the one that regresses silently**: keep `routes` as `z.record(z.string())`, or the bad key is refused before the check runs and rule 5 can never fire on a real graph |
| a node declaring `appendedAtMerge` is exempt under `exemptFlag: 'appendedAtMerge'` and NOT exempt under `exemptFlag: 'mintableOnRequest'` | one shared "any flag exempts" reading lets a step hide behind a family's flag |
| the three exemptions pass: `recipe`, `read`, the `warpgate` family | |
| the real `questFlowStatics` (story 04) returns zero violations, under `terminals: ['@complete','@blocked']` | |
| the real `agentFlowStatics` (story 05), each of the six graphs, returns zero violations under `terminals: ['@done','@blocked']` | subject to the `OPEN` above — if the step graph is not reachable from here yet, this assertion lives in `orchestrator` instead and the lint rule covers the family graph alone |
| the lint rule reports on the statics FILE and stays silent on every other filename | that is what a `RuleTester` case can actually prove here |
| `StartServer` throws on a bad graph, **from the same transformer** | assert both callers, or they drift |
| the thrown message and the lint message are the SAME string | one copy of eight sentences, or they drift too |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| change either graph to make the check pass | if a real graph fails, that is a finding — report it, do not edit the config to suit your checker |
| move `agentFlowStatics` | story 05 owns that path. If the `OPEN` above resolves that way it is a change TO story 05 — report it, do not make it |
| duplicate the eight messages into the rule's `messages` map | nothing. One `messageId` carrying the rendered violation is what keeps the two callers from drifting |
| validate a PLAN | story 08. This checks the CONFIG |
| add a family-level `maxVisits` | no family back-edge is declared. The day one is, that field is needed — and this check is what catches its absence |
