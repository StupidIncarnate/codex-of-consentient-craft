/**
 * PURPOSE: Classifies agent prompt names by dispatch surface — `minion` names are dispatched
 * by a parent agent via the Agent tool and receive a minimal "Quest ID + Work Item ID" $ARGUMENTS
 * substitution; `role` names map to AgentRole operation-relay sessions dispatched by the
 * orchestrator.
 *
 * USAGE:
 * agentPromptClassificationStatics.minionNames.includes(name);
 * // Returns true if the agent prompt name is a parent-dispatched minion.
 *
 * `promptNames` and `roleNames` are the source `agentPromptNameContract` and `agentRoleContract`
 * build their enums from, so the three lists cannot drift. A test that must cover every served
 * prompt reads them from here — test files may not import contracts, and a hand-copied list goes
 * quietly stale the moment a prompt is added.
 *
 * `roleNames` and `minionNames` are DISJOINT, and the shape that keeps them so is now the whole
 * design rather than an accident of naming: there is no longer one minion family per parent role.
 * The five operation-owning roles share ONE template (`operationOrchestratorPromptStatics`) and
 * summon the SAME three GENERIC minions — `planner-minion`, `worker-minion`, `reviewer-minion` —
 * which are parameterized at fetch time by the dispatching role's discipline
 * (`roleToDisciplineStatics` → `disciplineToPackTransformer`) instead of being named after it. A
 * generic minion therefore CANNOT be a role: it has no discipline of its own until a role hands it
 * one. `chaoswhisperer-gap-minion` is the one minion outside that trio — a spec-phase minion with
 * no discipline at all.
 *
 * The mechanical stakes are unchanged: a minion added to `roleNames` would widen `agentRoleContract`
 * with a role no operation item can ever hold; a role added to `minionNames` would let it fetch its
 * prompt without a workItemId and escape `subagentStopNeedsBlockGuard`.
 */

export const agentPromptClassificationStatics = {
  promptNames: [
    'chaoswhisperer-gap-minion',
    'planner-minion',
    'worker-minion',
    'reviewer-minion',
    'codeweaver',
    'spiritmender',
    'flowrider',
    'groundstomper',
    'siegemaster',
    'pesteater',
    'warpgate',
  ],
  roleNames: [
    /** The five operation-owning roles below are served the SAME `operationOrchestratorPromptStatics`
     * template; what differs between them is only the discipline pack interpolated at `$DISCIPLINE`
     * (`roleToDisciplineStatics`). None of them opens a source file: each plans through a
     * `planner-minion`, builds through `worker-minion`s, and verifies through a `reviewer-minion`. */
    'codeweaver',
    'flowrider',
    'groundstomper',
    'siegemaster',
    'pesteater',
    /** Spiritmender — the relay worker dispatched on a ward red or a repairable riftcarver red. It
     * keeps its own bespoke template: a repair is not an operation grouping, so it has no
     * planner/worker/reviewer round and no discipline. */
    'spiritmender',
    /** Warpgate — merge relay worker, dispatched from the ledger like any other role; lands the
     * quest branch on the base branch. `tavernkeeper` is deliberately absent from this list (and
     * from `promptNames`/`minionNames`) — chat roles are served by the chat prompt path, not by
     * `get-agent-prompt`. */
    'warpgate',
  ],
  minionNames: [
    /** ChaosWhisperer summons this during the SPEC phase, long before any operation item exists, so
     * it carries no `$DISCIPLINE` placeholder and must never be handed a discipline. */
    'chaoswhisperer-gap-minion',
    /** The three generic phases of one operation round. Each carries a `$DISCIPLINE` placeholder its
     * summoning orchestrator's discipline fills in, which is why the same three names serve
     * implementation, bug-repro, below-browser, browser-e2e and manual-qa alike. */
    'planner-minion',
    'worker-minion',
    'reviewer-minion',
  ],
} as const;
