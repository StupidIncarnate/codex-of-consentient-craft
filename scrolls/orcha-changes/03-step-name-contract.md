# 03 — the step name contract opens

```
GOAL      A quest.json holding a work item whose prompt no longer exists still LOADS.
          Dispatch is where an unknown name fails, not parsing.
AFTER     02 (which already uses `stepNameContract`)
BEFORE    05 (the step graph names prompts) · 24
PACKAGE   @dungeonmaster/orchestrator
MODEL     sonnet
```

**Small story, and it is here rather than later because story 05 cannot pin its config without it.**

---

## The idea

Prompts get swapped in and out. That is the whole point of this redesign: turning
`planner → worker → reviewer` into `planner → recipe → worker → reviewer` should be a config edit.
But `agentPromptNameContract` is a closed enum today, so a quest that ran under an old set of prompts
fails to parse the day one is renamed — and it fails at the WHOLE quest, not at the one row.

**Families keep their enum. Steps open.** The stable layer stays closed; the volatile layer does not.

---

## BUILD

| File | Change |
|---|---|
| `packages/orchestrator/src/contracts/agent-prompt-name/agent-prompt-name-contract.ts` | from `z.enum([...])` to a branded `z.string().min(1)` |
| `packages/orchestrator/src/statics/agent-prompt-classification/agent-prompt-classification-statics.ts` | this holds the roster — eleven names today. It STAYS, and stays exhaustive. It is now the runtime roster rather than the type |
| `packages/orchestrator/src/transformers/agent-name-to-prompt/agent-name-to-prompt-transformer.ts` | must now FAIL LOUDLY on a name it does not know, naming the name and the family. Today the enum made that unreachable |
| every `as const` / exhaustive-switch over the old enum | make each one explicit. **You do not have to find them: a `const exhaustiveCheck: never` over an opened type stops compiling**, so `tsc` hands you the complete list. `roleToPromptTemplateTransformer` is the one already known to carry one |

**Do not widen `workItemRoleContract`.** Roles are families; families are the stable layer.

---

## DONE WHEN

| Assert | |
|---|---|
| `agentPromptNameContract.parse('a-prompt-nobody-declared')` returns it | the contract no longer closes the set |
| serving that name throws, and the message names the NAME | a typo must be findable. A silent undefined here is a session dispatched against nothing |
| every one of today's eleven names still serves its existing prompt, byte for byte | this story changes what is ACCEPTED, never what is SERVED |
| the orchestrator package typechecks | the exhaustive switches are the work, and tsc is what finds them |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| add any new prompt name | story 25 |
| delete `roleToPromptTemplateTransformer` | story 24. It and `agentNameToPromptTransformer` return byte-identical templates today and agree only by construction — assert that before 24 deletes one |
| touch `roleToModelStatics` | story 24 supersedes it for the six families |
