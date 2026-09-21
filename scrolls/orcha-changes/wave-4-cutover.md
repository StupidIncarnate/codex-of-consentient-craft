# Wave 4 — the cutover

**The one wave where the tree genuinely cannot stay green mid-session.** Four sessions, and they are
serial rather than parallel: each one hands the next a tree that compiles, but no single one of them
can be interrupted half-done.

**Model: opus** for 4A and 4D, **sonnet** for 4B and 4C.

**Wave 5 lands in the same window.** 4D deletes `get-qa-checklist` and the sign-off writers behind it;
wave 5 deletes the fields those writers wrote. Ship one without the other and the derivation brokers
disagree with the record. Coordinate the merge, not the authoring.

---

### 4A — advance, the selector, and lazy scope creation

```
READ      plan §3b ("The three layers, and when each is created") · §6 · §"Which
          invariants break" (the questAdvanceBroker paragraph)
OWNS      packages/orchestrator/src/brokers/quest/get-next-step/select-batch-layer-broker.ts
          .../compute-next-step-from-quest-layer-broker.ts
          .../compute-ready-work-items-layer-broker.ts
          packages/orchestrator/src/brokers/quest/advance/quest-advance-broker.ts
          packages/orchestrator/src/brokers/quest/build-relay-graph/quest-build-relay-graph-broker.ts
          packages/orchestrator/src/responders/orchestration/start/orchestration-start-responder.ts
          packages/orchestrator/src/transformers/work-items-to-quest-status/…
          packages/orchestrator/src/transformers/relay-tail-fan-out/…
NO TOUCH  the deterministic handlers (4B) · capacity and instances (4C) · the deletions (4D)
DONE      a family's scopes are minted when that family is ROUTED TO, not at Start;
          `complete` comes from the family graph reaching `@complete`, never from a
          drained ledger; the selector returns a BATCH with a join
ASSERT    parallelism is one line today — `const [first] = ready;` at
          select-batch-layer-broker.ts:17 — so assert the batch and the join, not the
          spawn machinery, which already does `Promise.all`. Then lazy minting fixes a
          real bug: an operator adds an observable mid-quest, and under Start-time minting
          flowrider's scopes were already cut from the flows as they stood at approval, so
          that observable never gets a flowrider session. Assert it DOES now. Then the
          seam rule: `relayTailFanOutTransformer` assigns a glue seam's units to the LATER
          cell only — the orchestrator already computes cell order, so which side comes
          second is a fact it holds at fan-out time
```

---

### 4B — the deterministic handlers, and `args`

```
READ      plan §3b (CLOSE_OUT, the deterministic-step rules) · §"Committing becomes a
          deterministic step" · §"The ward gates"
OWNS      four handlers — `commit`, `ward`, `riftcarver`, `cleanup` — and the `args:
          string[]` plumbing
          the deletion of `wardMode` from the operation item, its contract, advance and
            both splices
NO TOUCH  the selector (4A) · the router itself (wave 2) · any prompt (wave 6)
DONE      each handler classifies its exit into one of the four outcome words, and the
          commit handler PUSHES
ASSERT    the handler was invoked with the step's `args` VERBATIM — that is now the only
          thing between a branch ward and a full one. Then the three the plan singles out:
          a 0-file ward scope is `empty`, not green; riftcarver's `repairable` maps to
          `unmet` while both `git-state` and permission-denied map to `wall`; and the
          commit message is DERIVED from the work item's observations, because a handler
          has no prose to write. Then the push: bare, no `-u`, because riftcarver already
          set the upstream at carve time
```

**Three holes collapse into this one change, and one of them is easy to miss.** Siege has no committer
at all once `siegemaster-reviewer` is deleted — both walkers are categorically forbidden to commit.
Codeweaver has too many: nine cells means nine reviewers, one worktree, one `index.lock`, and that
collision is measured rather than theoretical. And nothing committed after a `repair` in ANY family —
including `riftcarver` and `wardFull`, which get no `CLOSE_OUT` and so declare their own `commit` step.

---

### 4C — capacity, and the router owning instances

```
READ      plan §"Concurrency is measured for lanes, and a step field for everything else"
          · §9g
OWNS      the capacity read before each lane batch
          `start` and `kill` around every `needsLane` work item
          the instance id as the fifth prompt substitution, in
            packages/orchestrator/src/transformers/work-item-to-prompt/…
          `maxConcurrent: { limit, counts }` enforcement for flowrider's browser cap
NO TOUCH  scrolls/seigelense/remaining-build-items.md's remaining tool work — **read it
          first**, because siegelense is not finished and this depends on the parts that
          are
DONE      a `needsLane` step never dispatches without an instance, and never leaves one
          running after its work item records
ASSERT    `kill` ran when the work item recorded **including when it recorded `wall`** —
          that is the case a session-owned close could never reach, and the whole reason
          this moved off the walker. Then the instance id reached the RENDERED prompt.
          Then the two budgets stay separate: siege lanes come from `suggested`, and
          flowrider's four browser walks are a different pool `capacity` cannot see,
          counted over pieces carrying a browser unit rather than over units
```

**The cap cannot live in the plan contract, and the reason is structural:** a mark-minted piece is by
definition not in the plan. Three walkers marking `unmet` mint three fixers outside any declared
batch. The plan check is an early warning; the router is the enforcement.

---

### 4D — the deletions

```
READ      plan §"What else this touches" · §5 (the two tools that replace these)
OWNS      packages/orchestrator/src/responders/quest/get-qa-checklist/  — DELETE the
            responder and the MCP tool; its derivation brokers survive as 3A's internals
          the reset-flow-signoffs broker and its MCP tool — DELETE
          packages/orchestrator/src/transformers/role-to-prompt-template/  — DELETE,
            including its `const exhaustiveCheck: never`
          packages/shared/src/statics/quest-type-registry/  — DELETE, once every caller
            reads questFlowStatics
          the spiritmender and warpgate SPLICES — hand-written slice arithmetic in two
            brokers, now one route entry each
          `agentPromptClassificationStatics.operatorRoleNames`
NO TOUCH  the sign-off FIELDS — wave 5, same merge window
          any prompt body — wave 6
DONE      nothing references a deleted symbol, and the tree compiles
ASSERT    `roleToPromptTemplateTransformer` and `agentNameToPromptTransformer` return
          byte-identical templates today and agree only by construction — assert the
          survivor still serves every name the deleted one did, before deleting it
```

**Four callers of `questTypeRegistryStatics` are outside the orchestrator** — `chat-start-responder`,
`quest-create-broker`, and four web e2e specs including `bughunt-begin-transition.e2e`. The e2e specs
read the registry deliberately, so that a seeded relay is checked against real data rather than an
assumption. They need the same treatment, not deletion.
