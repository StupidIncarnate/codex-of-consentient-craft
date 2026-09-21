# 28 — the independent work (a set of ~12: 1 + 6 + 4 + 1)

```
GOAL      Three unrelated bodies of work that wait on nothing in the chain.
AFTER     nothing, mostly — two exceptions noted below
MODEL     sonnet
```

**Start this at the same time as story 01.**

---

## 28a — delete `glyphsmith`

```
OWNS      packages/orchestrator/src/statics/glyphsmith-prompt/   — 3,721 bytes, VERIFIED exact
          the SIX files carrying real logic — the table below names each with its line
          30 non-test source files naming the role in total; the other 24 are list
          entries, enum members and prose. MEASURED, not estimated — see the table
NO TOUCH  the design STAGE, and `design_approved`
ASSERT    `design_approved` was always set by a HUMAN rather than by that session, so the
          stage loses nothing it depended on. Assert the stage still advances with no
          glyphsmith anywhere
```

**Byte size confirmed exact.** `packages/orchestrator/src/statics/glyphsmith-prompt/glyphsmith-prompt-statics.ts`
is 3,721 bytes on disk, and its colocated `glyphsmith-prompt-statics.test.ts` is 442 bytes — both delete
together.

**MEASURED, so nobody re-counts.** A sweep of `packages/**/*.ts(x)` for `/glyphsmith/i`, excluding
`*.test.*`, `*.proxy.*`, `*.stub.*`, `*.harness.*`, `*.e2e.*`, any `/test/` directory and the `.ward/`
run artefacts:

| | Count |
|---|---|
| non-test source files | **30** |
| test / proxy / stub / harness files | 25 |
| markdown | 2 — `packages/orchestrator/CLAUDE.md` (8 mentions), `packages/testing/CLAUDE.md` (3) |

**"Only two are more than a list entry" is WRONG — there are SIX**, and the four extra ones are live
`role === 'glyphsmith'` branches, two of which throw. A session that believes the old claim deletes the
role and leaves them standing:

| File | Why it is not a list entry |
|---|---|
| `packages/orchestrator/src/responders/design-chat/start/design-chat-start-responder.ts` | the whole file exists for this role. `:2` *"Starts a design chat session by spawning a Glyphsmith Claude CLI process…"*; `:33` `role: workItemRoleContract.parse('glyphsmith'),`; `:65` mints the work item via `workItemContract.parse` |
| `packages/web/src/brokers/design/session/design-session-broker.ts` | the web half, 33 lines, all of it glyphsmith — POSTs `webConfigStatics.api.routes.designSession` |
| `packages/orchestrator/src/brokers/chat/spawn/resolve-chat-quest-layer-broker.ts` | `:72` `if (role === 'glyphsmith') {` — a whole branch, **with two throws**: `:74` `'questId is required for glyphsmith role'` and `:87` `` `Quest ${questId} has no glyphsmith work item` `` |
| `packages/orchestrator/src/transformers/chat-prompt-build/chat-prompt-build-transformer.ts` | `:17` imports `glyphsmithPromptStatics`; `:50-51` `(role === 'glyphsmith' ? glyphsmithPromptStatics` selects the template |
| `packages/orchestrator/src/brokers/chat/spawn/chat-spawn-broker.ts` | `:170` `processIdPrefixContract.parse(role === 'glyphsmith' ? 'design' : 'chat')` and `:215` `if (!sessionId && extractedSessionId !== null && role === 'glyphsmith')` |
| `packages/orchestrator/src/brokers/quest/orchestration-loop/run-chat-layer-broker.ts` | `:65` `workItem.role === 'glyphsmith' ? 'design' : 'chat'` — the same prefix decision, a second copy |

**One decision falls out of the last two, and it is not a deletion.** The `design` value of
`processIdPrefixContract`
(`packages/orchestrator/src/contracts/process-id-prefix/process-id-prefix-contract.ts:2`) exists for
glyphsmith alone — both branches above resolve to it and nothing else does. Remove the role and `design`
has no producer left. **Decide whether the prefix value goes with it, and say which in the commit**; a
dangling enum member is how the next reader concludes the role is still reachable.

**A prior ownership bug, worth knowing before this session starts.** Story 25 (prompts) originally
claimed `glyphsmith-prompt/` too, and corrected itself: `scrolls/orcha-changes/25-prompts.md:1505` —
*"`glyphsmith-prompt/` is NOT yours — it was, and that was an ownership bug. Story 28a owns it, and"* —
so this directory is uncontested now, but check that story 25's own file still reflects the correction
before assuming no overlap.

**`design_approved` independence confirmed.** It is a quest STATUS value
(`questStatusTransitionsStatics`), set by a `User approves designs` action per `orchestrator/CLAUDE.md`'s
own status table, not by any agent. Story 25 has already found the same thing and left it as settled:
`scrolls/orcha-changes/25-prompts.md:1545` — *"Fix 1 — the design stage has no agent behind it.
`glyphsmith` is deleted; the design stage and"* — and `:1547` confirms a search of the prompt driving the
spec lifecycle (`dumpster-create-prompt-statics.ts`) for glyphsmith or a design-stage agent found
nothing.

---

## 28b — six defects, each its own small session

| Defect | Where | Fix |
|---|---|---|
| `riftcarver` missing from the floor list, so it sorts last on a depth tie | `shared/src/statics/execution-floor-config/execution-floor-config-statics.ts` | add its entry. That list is also the dispatcher's sort tiebreak. **Verified — the real 11-entry list is quoted below** |
| `orchestrationPhaseContract` is dead — a stale closed role enum, no consumer | `orchestrator/src/contracts/orchestration-phase/` | delete it, its stub and its test. **Verified — `discover({ grep: "orchestrationPhaseContract" })` returns only its own contract, `.test.ts` and `.stub.ts`, plus two planning docs. Zero hits under `brokers/`, `responders/`, `transformers/`** |
| `dagTopologicalSortTransformer` + `dagReadyNodesProcessTransformer` are dead | `orchestrator/src/transformers/dag-topological-sort/` and `orchestrator/src/transformers/dag-ready-nodes-process/` — confirmed, both directories exist, no hedge needed | delete both. The live path is `computeWorkItemDepthsTransformer` at `shared/src/transformers/compute-work-item-depths/compute-work-item-depths-transformer.ts`, consumed by `shared/src/transformers/work-items-in-dispatch-order/work-items-in-dispatch-order-transformer.ts:31`. **Verified — `dagTopologicalSortTransformer` (`dag-topological-sort-transformer.ts:14`) imports `dagReadyNodesProcessTransformer` internally, and neither has any caller outside its own test file** |
| `slotManagerStatics` JSDoc names a `slotCount` key that does not exist | `orchestrator/src/statics/slot-manager/slot-manager-statics.ts` | correct it. Story 15 replaces the budgets with `maxVisits`, so coordinate that line. **Verified — line 5's `USAGE` example reads `slotManagerStatics.codeweaver.slotCount;`; the real key at line 19 is `maxAttempts: 3,`. Fix the JSDoc to name whichever key is live when this session runs — `maxAttempts` if before story 15, `maxVisits` if after** |
| `orchestrator/CLAUDE.md:634` is stale on concurrent browser walks | vs `flowrider-prompt-statics.ts:354` | **settled, but both line numbers below have drifted — use the real ones.** `orchestrator/CLAUDE.md:634` still reads *"Flowrider adds one more rule: never two browser walks against the same package at once, because Playwright writes"* — genuinely stale — and `flowrider-prompt-statics.ts:353-354` genuinely contradicts it: *"**Browser walks against the same package DO go out together, up to four at a time.** Ward hands every e2e run its own port pair, its own Playwright report path and its own artifact folder, so…"*. The resolution is real but at **`packages/ward/CLAUDE.md:439`** (not 430) — *"**Every e2e run is isolated from every other one, so SEVERAL browser walks against one package can run at once.**"* — and **`:445`** (not 436) for the per-run report-path row. A third source agrees independently: `scrolls/orcha-changes/23-instances-and-capacity.md:181-183` — *"Ward already isolates concurrent browser runs… each run gets its own port pair from `netFreePortPairAdapter`, its own `.ward-playwright-report-<serverPort>.json`, and its own `outputDir`."* Fix `orchestrator/CLAUDE.md:634` to match |
| codeweaver's brief template promises a `MIRROR` block it never defines | `codeweaver-prompt-statics.ts:644`, `:647` | make it a real field or drop the references. **Verified exact, no drift** — line 644: *"This brief is meant to be enough. FILES, FACTS, FENCES, UNITS and MIRROR carry what the"*; line 647: *"MIRROR does not show, a FACT the file contradicts. Searching for what the brief already"* — MIRROR is named twice and defined nowhere else in the file. Flowrider's map DOES define one, twice: `flowrider-prompt-statics.ts:287-288` (`MIRROR\n  <the nearest existing spec, per file>`) and `:605-606` (`MIRROR\n  <the nearest existing spec to copy>`) — confirms "likely an omission" |

**The real floor list, verbatim, `execution-floor-config-statics.ts:9-23`:**

```
export const executionFloorConfigStatics = {
  floors: [
    { name: 'HOMEBASE', role: 'chaoswhisperer', type: 'entrance' },
    { name: 'HOMEBASE', role: 'glyphsmith', type: 'entrance' },
    { name: 'HOMEBASE', role: 'bughunt', type: 'entrance' },
    { name: 'FORGE', role: 'codeweaver', type: 'floor' },
    { name: 'MINI BOSS', role: 'ward', wardPosition: 'first', type: 'floor' },
    { name: 'INFIRMARY', role: 'spiritmender', type: 'floor' },
    { name: 'GLUEWORKS', role: 'flowrider', type: 'floor' },
    { name: 'ARENA', role: 'siegemaster', type: 'floor' },
    { name: 'FLOOR BOSS', role: 'ward', wardPosition: 'last', type: 'floor' },
    { name: 'TAVERN', role: 'tavernkeeper', type: 'floor' },
    { name: 'WARPGATE', role: 'warpgate', type: 'floor' },
  ],
} as const;
```

No `riftcarver` entry anywhere. This session's own `glyphsmith` row retires alongside 28a, whichever
order the two land in — coordinate rather than assume.

**One correction already made, kept so nobody re-derives it.** `devServer.devCommand` is NOT unread —
`tavernkeeper-prompt-statics.ts:86` reads it, verbatim: *"- **Resolve, never invent.** Read
`.dungeonmaster.json` at the root of your cwd for `devServer.devCommand` and `devServer.port`. Run
exactly that command on exactly that port —"*. A SESSION reads it, not code, which is why a grep for
readers missed it.

**The three still apparently unread, with their definition sites**, so the prompt-text check has
somewhere to start. Every hit for each is a contract, a default or a test — no production reader and no
prompt text:

| Knob | Defined at | Every other hit |
|---|---|---|
| `orchestration.timeoutMs` | `packages/config/src/contracts/dungeonmaster-config/dungeonmaster-config-contract.ts:51-54` | its own `.test.ts`, nothing else |
| `devServer.readinessPath` | same contract, `:99-102` | `config-defaults-statics.ts:39`; `environment.harness.ts:42-43`, whose comment already says *"Never read by Start…"* |
| `devServer.readinessTimeoutMs` | same contract, `:103-108` | `config-defaults-statics.ts:45-46` |

**Grep the prompt statics for each name before removing it** — that is the check `devCommand` failed,
and these three share the shape that let it fail.

---

## 28c — `verifyByHuman`, one pass or not at all

Four coordinated sessions that merge together. Half of it leaves an unclosable unit visible to a
session that will invent a mark for it.

| | Owns | Order |
|---|---|---|
| **28c-1** | `verifyByHuman: true` on `flowObservableContract`, beside `verifyByReading` at `flow-observable-contract.ts:76` | first |
| **28c-2** | the human-check value in the step's declared scope | **after story 26.** It is one more value in `verificationMethods`, the field 26 re-keys. Land it before and you write it twice |
| **28c-3** | the shared "can anything automate this?" block, and the filter | the block is interpolated into ChaosWhisperer's prompt AND both walkers' from ONE source. The filter drops these units from every work-item view once the quest is `in_progress` |
| **28c-4** | the fourth citation kind, the end-of-quest list, and the `(human-check)` panel | the panel needs **a control that takes the person's verdict** |

**28c-1, verified.** `flow-observable-contract.ts:76-81` is a bare optional boolean, no default, no
brand — the exact shape `verifyByHuman` should copy:

```
  verifyByReading: z
    .boolean()
    .optional()
    .describe(
      'Set true when the criterion is about the shape of a source file — …',
    ),
```

**28c-2, the real line numbers** (drift risk once story 26 re-keys this file, so re-check after it
lands): `signoff-track-eligibility-statics.ts:138` is codeweaver's `verificationMethods: ['test', 'reading'],`,
`:158` is flowrider's `verificationMethods: ['test'],`, `:185` is siegemaster's `verificationMethods: ['test'],`.

**28c-3, the pattern to copy — confirmed, three real call sites, not a hypothetical.**
`standardsReviewConcernsStatics` (`orchestrator/src/statics/standards-review-concerns/standards-review-concerns-statics.ts`)
is interpolated as `${standardsReviewConcernsStatics.markdown}` at:
`codeweaver-reviewer-statics.ts:321`, `flowrider-reviewer-statics.ts:283`, `siegemaster-reviewer-statics.ts:301`.
28c-3's new block follows the identical shape: one statics file, one markdown export, interpolated into
ChaosWhisperer's prompt and both walkers' from that one source.

**28c-4, a boundary the story text does not currently name: `citationKindContract` lives in a
DIFFERENT package.** Real path: `packages/siegelense/src/contracts/citation-kind/citation-kind-contract.ts:17-19`:

```
export const citationKindContract = z
  .enum(['verified-prelude', 'open-issue', 'walked-note'])
  .brand<'CitationKind'>();
```

Exactly three values today — confirms "the fourth citation kind" is genuinely additive, not already
partially built. **28c-4 reaches into `@dungeonmaster/siegelense`, not just `@dungeonmaster/orchestrator`
— its OWNS line should say so**, since a session briefed only on the orchestrator package will not find
this file by habit.

**Why the filter is stronger than just dropping the unit from a denominator.** A session that can SEE a
unit it cannot close does not skip it. It reaches for the nearest thing it can measure — a proxy
assertion, a change-detector, a `toSettle` naming an action nobody will take — and now the quest carries
a test pinning the wrong thing plus a session that spent a pass on it.

**The citation kind cannot wait.** A `verifyByHuman` unit hands a person a `.webm` and a question, and
that list reaches them at quest END — so a screencast deleted on the two-day video retention window is a
link that rots before its only reader.

**An open question blocks 28c-1 — OPEN, the conductor decides.** Is author-only enforcement prompt text,
or a real mechanism? The existing rule for `verifyByReading` is prompt text only, confirmed exact:

- `packages/orchestrator/CLAUDE.md:851` — *"**`verifyByReading: true` is the one field that says "no
  test settles this".** It marks a criterion about the SHAPE of"* — and the same paragraph, further
  down: *"**Only ChaosWhisperer and BugHunt can set this**"*.
- `dumpster-create-prompt-statics.ts:158` — *"- `verifyByReading` (optional): `true` when the criterion
  is about the SHAPE OF A SOURCE FILE — an import that must be there, a literal that must not be
  inlined, a symbol that must be gone, a STYLE VALUE that must be the one declared. Set it and a
  reviewer opens the file; leave it out and a session writes a test."*

Confirmed: `verifyByReading` is `.optional()` with no Zod refinement and no guard anywhere restricting
who may set it — the author-only rule really is prompt text only, nothing enforces it today. Matching
that precedent is cheap; enforcing it properly is new machinery. **Decide which, and if it is the
second, apply it to BOTH flags.**

**Motion quality is what this route exists for**, and `siegemaster-verifier-statics.ts:320-322` still
asks for it, quoted in full:

```
**Report how it LOOKED and FELT, not only whether it worked.** Note it when something is misaligned or
overlapping, a label is truncated or wraps badly, a transition jumps or flickers, a spinner never
resolves, an action gives no feedback that it worked, …
```

"a transition jumps or flickers" sits beside truncation and overlap, which ARE measurable. A model
cannot grade animation — four frames 1.5 seconds apart cannot tell a clean 300ms transition from a
janky one, and every comparison capture is frozen with `animations: 'disabled'` precisely so
`pixelChange` is not noise. Cut it from the walker and route it here.

---

## 28d — the hydration tail

```
OWNS      packages/orchestrator/src/brokers/quest/hydrate/quest-hydrate-broker.ts
          — its OWN `firstWorkItem` construction, lines 127-147
AFTER     story 02 (it needs the `step` field) · see the carve-out with story 22 below
DONE      each fabricated work item carries a `step` and its units
ASSERT    a fabricated work item with no `step` is UNDISPATCHABLE — assert the refusal,
          not just that the field is present
```

**The old OWNS line ("every hydration recipe that fabricates a work item," pointing loosely at
`packages/hydration-recipes/`) is WRONG — corrected above.** Read in full: none of
`packages/hydration-recipes/**`'s ten recipe brokers construct a `WorkItem` directly — they write
`operations`, then reach `in_progress` by routing through the orchestrator's own `questHydrateBroker`.
The actual fabrication site recipes ultimately depend on is a single broker.

**A sibling story has already carved this scope narrower than this file's own text says, and that
carve-out is the real boundary — read `scrolls/orcha-changes/22-advance-onto-the-graph.md` before
starting.** Its line 53: *"Hydration's own work — a `step` and units on every fabricated work item — is
story 28d."* Story 22 itself already gives `step` to the OTHER two production work-item mint sites:

| Mint site | Real path | Who adds `step` |
|---|---|---|
| Start-Quest's first work item | `orchestrator/src/brokers/quest/build-relay-graph/quest-build-relay-graph-broker.ts:151-175` (`firstActionable` / `firstWorkItem`) | **story 22** — `22-advance-onto-the-graph.md:45`: *"stays, and the work item gains `step` exactly as advance's does"* |
| the relay-advance mint | `orchestrator/src/brokers/quest/advance/quest-advance-broker.ts:66-85` | **story 22** — `:25` |
| hydration's own first work item | `orchestrator/src/brokers/quest/hydrate/quest-hydrate-broker.ts:127-147`, `workItemContract.parse(...)` at line 130 | **28d, this session** — it calls `questBuildRelayGraphBroker` at its own line 90 only for `relay.operations`, discards `relay.workItems`, and re-derives its own first work item after applying blueprint `skipRoles` filtering, so story 22's fix to the OTHER two sites does not reach this one |

**`workItemContract` carries no `step` field today** — confirmed by reading the whole contract
(`shared/src/contracts/work-item/work-item-contract.ts`): the full field list is `id, role, status,
spawnerType, sessionId, agentId, relatedDataItems, dependsOn, attempt, maxAttempts, retryCount,
lastWardRunId, createdAt, startedAt, startRef, completedAt, errorMessage, summary, insertedBy, resume,
wardMode, packageNames, smoketestPromptOverride, smoketestExpectedSignal, actualSignal` — exactly what
"AFTER story 02" says is missing.

**OPEN — two more fabrication sites exist that neither this story nor story 22 currently names, found
while verifying this session's scope. The conductor decides whether they belong here:**

- `orchestrator/src/transformers/case-catalog-to-blueprint/case-catalog-to-blueprint-transformer.ts:96`
  — mints a whole chain of pre-stamped `codeweaver` work items for bundled MCP/Signals smoketest suites,
  spliced in by `enqueue-bundled-suite-layer-responder.ts` after `questHydrateBroker` runs.
- `orchestrator/src/transformers/smoketest-substitute-work-item-placeholders/smoketest-substitute-work-item-placeholders-transformer.ts:62`
  — a related smoketest placeholder-substitution mint site.

Neither is "a hydration recipe" in the sense `packages/hydration-recipes/**` means, and neither is named
in story 22's carve-out either. If they fabricate work items that skip the graph's dispatch check the
same way `quest-hydrate-broker.ts` would without this fix, they need the same `step` treatment — or an
explicit reason they don't. **Do not silently fold them into this session's OWNS; flag them to whoever
is coordinating story 22/28d and let that person decide the boundary.**

Small, mechanical, and easy to forget until a smoketest fails for a reason nobody can read.
