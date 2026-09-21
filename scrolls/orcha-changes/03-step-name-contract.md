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

**WRONG, flagged rather than silently fixed (the AFTER line is a decomposition boundary and stays as
written):** the header's `AFTER 02 (which already uses \`stepNameContract\`)` is not accurate. This
story never touches `stepNameContract` — that is a DIFFERENT contract, in a different package
(`packages/shared/src/contracts/step-name/`, built by story 02), naming a STEP KEY like `'work'`
inside `agentFlowStatics[family].steps`. This story opens `agentPromptNameContract`
(`packages/orchestrator`), which names a PROMPT like `'codeweaver-worker'` — a separate vocabulary
entirely (see `02-work-item-fields.md`'s own note on this). The chain document
(`00-CHAIN.md:65`) describes this story correctly as *"`agentPromptNameContract` opens to free
strings"*, with no dependency on 02 listed. This story has no real code dependency on story 02;
the two are independent and merely sit in the same phase.

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
| `packages/orchestrator/src/contracts/agent-prompt-name/agent-prompt-name-contract.ts` | from `z.enum(agentPromptClassificationStatics.promptNames)` to `z.string().min(1).brand<'AgentPromptName'>()` |
| `packages/orchestrator/src/statics/agent-prompt-classification/agent-prompt-classification-statics.ts` | this holds the roster — eleven names today. It STAYS, and stays exhaustive. It is now the runtime roster rather than the type |
| `packages/orchestrator/src/transformers/agent-name-to-prompt/agent-name-to-prompt-transformer.ts` | must now FAIL LOUDLY on a name it does not know, naming the name. See "The one runtime check this story adds" below |

**Do not widen `workItemRoleContract`, and do not touch `agentRoleContract`.** Roles are families;
families are the stable layer. `agentRoleContract` (`packages/orchestrator/src/contracts/agent-role/agent-role-contract.ts:13`)
is a SEPARATE, narrower enum — `z.enum(agentPromptClassificationStatics.roleNames)`, the five-member
`['codeweaver', 'flowrider', 'siegemaster', 'spiritmender', 'warpgate']` — built from `.roleNames`,
not `.promptNames`. This story opens `.promptNames`'s contract only; `.roleNames`/`agentRoleContract`
stays a closed enum untouched.

### The eleven names this story's contract must still accept, verbatim, with their kind and model

`agentPromptClassificationStatics.promptNames` (unchanged by this story — read it, do not restate it
by hand):

| Name | Kind | Model | Statics file |
|---|---|---|---|
| `codeweaver` | role | opus | `codeweaver-prompt/` |
| `flowrider` | role | opus | `flowrider-prompt/` |
| `siegemaster` | role | opus | `siegemaster-prompt/` |
| `spiritmender` | role | sonnet | `spiritmender-prompt/` |
| `warpgate` | role | opus | `warpgate-prompt/` |
| `codeweaver-reviewer` | minion | sonnet | `codeweaver-reviewer/` |
| `flowrider-reviewer` | minion | sonnet | `flowrider-reviewer/` |
| `siegemaster-reviewer` | minion | sonnet | `siegemaster-reviewer/` |
| `siegemaster-stress` | minion | sonnet | `siegemaster-stress/` |
| `siegemaster-verifier` | minion | sonnet | `siegemaster-verifier/` |
| `chaoswhisperer-gap-minion` | minion | sonnet | `chaoswhisperer-gap-minion/` |

(Source: `packages/orchestrator/CLAUDE.md`'s own "Agent prompts are served dynamically" section, which
carries this exact table — reuse it rather than re-deriving, so the two cannot drift.)

### There is only ONE exhaustive check this story breaks, and it is NOT `roleToPromptTemplateTransformer`

**Story 03 as originally cut named `roleToPromptTemplateTransformer` as carrying "an exhaustive-switch
over the old enum" that this story would need to fix. That is WRONG — checked by reading the file.**
`role-to-prompt-template-transformer.ts:25-42` switches on `role: AgentRole`
(`packages/orchestrator/src/contracts/agent-role/agent-role-contract.ts`), the FIVE-member role enum
above — not `AgentPromptName`, the eleven-member one this story opens. `AgentRole` is untouched by
this story, so that switch's exhaustiveness is unaffected and still compiles exactly as it does today.
Leave it alone; story 24 deletes the whole function later, for an unrelated reason (superseded by
`agentNameToPromptTransformer`).

**The ONE site that actually breaks is `agentNameToPromptTransformer`'s own `AGENT_PROMPTS` table**
(`agent-name-to-prompt-transformer.ts:95`): `} as const satisfies Record<AgentPromptName, unknown>;`.
Today, with `AgentPromptName` a closed 11-member union, that `satisfies` is a real compile-time
exhaustiveness check — a name added to `promptNames` with no row here fails to build. **Once this
story opens `AgentPromptName` to `z.string().min(1)`, that check is GONE, not preserved under another
name** — a branded non-literal string type against `Record<K, V>` no longer forces every literal key
to be present, because there is no longer a finite set of literals to check against. (Story 24's own
text claims the guarantee "moves rather than disappearing"; story 25's text is the accurate one —
*"Once `AgentPromptName` is an open string that check is gone, and story 03 replaces it with a loud
runtime throw. Nothing type-checks a missing row after that."* Flag this disagreement between 24 and
25 in your commit; this story sides with 25's wording, since it is the one actually building the
replacement.)

### The one runtime check this story adds

```ts
export const agentNameToPromptTransformer = ({
  agent,
}: {
  agent: AgentPromptName;
}): AgentPromptResult => {
  const entry = AGENT_PROMPTS[agent as keyof typeof AGENT_PROMPTS];

  if (entry === undefined) {
    throw new Error(
      `Unknown agent prompt name: '${agent}'. No prompt is registered for it in AGENT_PROMPTS — ` +
        'check agentPromptClassificationStatics.promptNames and this table still agree.',
    );
  }

  return agentPromptResultContract.parse({
    name: agent,
    model: entry.model,
    prompt: entry.template,
  });
};
```

Mirrors this package's own established style for an unreachable-branch throw —
`roleToPromptTemplateTransformer`'s own `default` case reads `throw new Error(\`Unknown role:
${String(exhaustiveCheck)}\`);` (`role-to-prompt-template-transformer.ts:39`) — a plain `Error`, not a
custom error class.

---

## DONE WHEN

| Assert | |
|---|---|
| `agentPromptNameContract.parse('a-prompt-nobody-declared')` returns it | the contract no longer closes the set |
| `agentNameToPromptTransformer({ agent: 'a-prompt-nobody-declared' })` throws, message reads `Unknown agent prompt name: 'a-prompt-nobody-declared'. No prompt is registered for it in AGENT_PROMPTS — check agentPromptClassificationStatics.promptNames and this table still agree.` | a typo must be findable. A silent `undefined.model` here is a session dispatched against nothing |
| every one of today's eleven names still serves its existing prompt, byte for byte | this story changes what is ACCEPTED, never what is SERVED |
| the orchestrator package typechecks | confirms `AGENT_PROMPTS[agent as keyof typeof AGENT_PROMPTS]` compiles against the now-opened `AgentPromptName`, and that `roleToPromptTemplateTransformer`'s switch over the untouched `AgentRole` still compiles unchanged |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| add any new prompt name | story 25 |
| delete `roleToPromptTemplateTransformer` | story 24. It and `agentNameToPromptTransformer` return byte-identical templates today and agree only by construction — assert that before 24 deletes one |
| touch `roleToModelStatics` | story 24 supersedes it for the six families |
