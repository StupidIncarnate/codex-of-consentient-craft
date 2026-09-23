/**
 * PURPOSE: Classifies agent prompt names by dispatch surface — a `minion` name is summoned by a
 * parent agent through the Agent tool and fetches with `{ agent, questId }`; a `role` name is an
 * operation-relay session the orchestrator dispatches, and fetches with `{ agent, questId,
 * workItemId }`. Reach for this over the contracts when you need the NAME LISTS themselves: test
 * files may not import contracts, and a hand-copied list goes quietly stale the moment a prompt is
 * added.
 *
 * USAGE:
 * agentPromptClassificationStatics.minionNames.includes(name);
 * // Returns true if the agent prompt name is a parent-summoned minion.
 *
 * `roleNames` is still the source `agentRoleContract` builds its five-member enum from.
 * `agentPromptNameContract` no longer builds an enum from `promptNames` at all — it accepts any
 * non-empty string, so a quest that ran under a renamed prompt still LOADS. `promptNames` is now the
 * RUNTIME roster `agentNameToPromptTransformer` checks a dispatched name against, throwing loudly, by
 * name, on one this list — and its own `AGENT_PROMPTS` table — do not carry.
 *
 * EVERY PROMPT IS ONE FILE, AND ITS NAME SAYS WHOSE IT IS. There is no generic template and no
 * discipline pack. Reviewers, planners, workers, and walkers are steps with their own work items;
 * `chaoswhisperer-gap-minion` is the only true parent-summoned minion without a work item. It runs
 * in the SPEC phase, before any operation item exists.
 *
 * `roleNames` and `minionNames` are DISJOINT, and the mechanical stakes are what enforce it: a
 * minion added to `roleNames` would widen `agentRoleContract` with a role no operation item can
 * ever hold; a role added to `minionNames` would let it fetch without a `workItemId` and escape
 * `subagentStopNeedsBlockGuard`, which is what holds a work-item session open until it signals.
 *
 * `operatorRoleNames` is the roles that own an operation item and brief sub-agents to do its work.
 * Membership is READ from here rather than listed at each call site, so a fourth operator role is
 * covered by the signal-back gates and the prompt renderer the day it is added — the same reason
 * `isChatWorkItemRoleGuard` reads `workItemRoleStatics.chat` instead of growing an `||` chain.
 */

export const agentPromptClassificationStatics = {
  promptNames: [
    'chaoswhisperer-gap-minion',
    'codeweaver',
    'codeweaver-planner',
    'codeweaver-reviewer',
    'codeweaver-worker',
    'flowrider',
    'flowrider-planner',
    'flowrider-reviewer',
    'flowrider-worker',
    'recipe-maker',
    'siege-adversarial-fixer',
    'siege-adversarial-walker',
    'siege-happy-fixer',
    'siege-happy-walker',
    'siege-planner',
    'siegemaster',
    'siegemaster-reader',
    'spiritmender',
    'warpgate',
  ],
  roleNames: [
    /** The three operation-owning roles. Each one owns a work item and briefs sub-agents rather
     * than writing the work itself — see `operatorRoleNames` below, which is this same three for
     * the call sites that only want membership. */
    'codeweaver',
    'flowrider',
    'siegemaster',
    /** Spiritmender — the relay worker dispatched on a ward red or a repairable riftcarver red. A
     * repair is not an operation grouping, so it briefs nobody and summons no minion. */
    'spiritmender',
    /** Warpgate — merge relay worker, dispatched from the ledger like any other role; lands the
     * quest branch on the base branch. `tavernkeeper` is deliberately absent from every list here —
     * chat roles are served by the chat prompt path, not by `get-agent-prompt`. */
    'warpgate',
  ],
  minionNames: [
    /** ChaosWhisperer summons this during the SPEC phase, long before any operation item exists. */
    'chaoswhisperer-gap-minion',
  ],
  operatorRoleNames: ['codeweaver', 'flowrider', 'siegemaster'],
} as const;
