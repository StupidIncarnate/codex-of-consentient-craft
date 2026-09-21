# 24 — remove what the new path replaced

```
GOAL      Nothing references a symbol the step engine replaced, and the tree compiles.
AFTER     22 · 23
BEFORE    25 · 26
PACKAGE   @dungeonmaster/orchestrator + @dungeonmaster/shared
MODEL     opus — the deletions cross package boundaries and four callers are outside the
          orchestrator
```

**Merge this with story 26.** This deletes the tools that WRITE the sign-off fields; 26 deletes the
fields. Ship one without the other and the derivation brokers disagree with the record.

---

## What goes, and what replaces it

| Thing | Fate |
|---|---|
| `get-qa-checklist` — the MCP tool and its responder | **deleted.** `get-quest-work` is the one startup call. **Its derivation brokers SURVIVE** and became story 18's internals — do not delete those |
| `reset-flow-signoffs` — the MCP tool and `quest-reset-flow-signoffs-broker` | **deleted.** Absorbed into `quest-work`'s `invalidation` payload, guards and messages carried across in story 17 |
| `roleToPromptTemplateTransformer`, including its `const exhaustiveCheck: never` | **deleted.** Everything resolves through `agentNameToPromptTransformer` |
| `questTypeRegistryStatics` | **deleted**, once every caller reads `questFlowStatics` |
| `wardMode` | **deleted** from the operation item, its contract, advance and both splices. Story 20's `args` replaced it |
| `agentPromptClassificationStatics.operatorRoleNames` | **goes.** "Which roles change code" is a step field now — the answer is per step, not per family |
| `isCommandWorkItemRoleGuard` / `workItemRoleStatics.command` | **simplifies.** `spawnerType` asks `step.kind`, not the role |
| `roleToModelStatics` | **superseded for the six families** — the model comes off the step. Survives for chat roles |
| the `pt N` continuation machinery | retires with duplicate-on-partial |

---

## Two traps

**`roleToPromptTemplateTransformer` and `agentNameToPromptTransformer` return byte-identical templates
today and agree only by construction.** Assert the survivor still serves every name the deleted one did
— BEFORE deleting it. A silent divergence here is a family served the wrong prompt.

**Four callers of `questTypeRegistryStatics` are outside the orchestrator:** `chat-start-responder`,
`quest-create-broker`, and four web e2e specs including `bughunt-begin-transition.e2e`. **Those e2e
specs read the registry deliberately**, so a seeded relay is checked against real data rather than an
assumption. They need the same treatment against `questFlowStatics`, not deletion.

---

## DONE WHEN

| Assert | |
|---|---|
| nothing references a deleted symbol, and the whole repo typechecks | `tsc` is what finds them |
| the four outside callers read `questFlowStatics` and their tests pass | |
| `get-qa-checklist`'s derivation brokers are STILL THERE and still used by `get-quest-work` | the easy over-delete |
| `invalidation`'s three guards still fire, with their original messages | carried, not rewritten |
| the MCP tool roster no longer lists the two deleted tools | |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| delete a sign-off FIELD | story 26, same merge window |
| delete a PROMPT | story 25 |
| delete `glyphsmith` | story 28 — independent of all of this |
