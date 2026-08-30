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
 * `promptNames` and `roleNames` are the source `agentPromptNameContract` and `agentRoleContract`
 * build their enums from, so the lists cannot drift apart.
 *
 * EVERY PROMPT IS ONE FILE, AND ITS NAME SAYS WHOSE IT IS. There is no generic template and no
 * discipline pack. The three operator roles — `codeweaver`, `flowrider`, `siegemaster` — brief
 * GENERIC sub-agents for the bulk of their work, so the only named minions are the ones whose
 * instructions cannot be written into a brief: each operator's own `<role>-reviewer`, and
 * `siegemaster-walker`, which drives a live system by hand. `chaoswhisperer-gap-minion` sits
 * outside that set entirely — it runs in the SPEC phase, before any operation item exists.
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
    'codeweaver-reviewer',
    'flowrider',
    'flowrider-reviewer',
    'siegemaster',
    'siegemaster-reviewer',
    'siegemaster-walker',
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
    /** One reviewer per operator role. A reviewer's name carries its parent's role because its
     * prompt carries that role's subject matter — there is nothing generic left for a bare
     * `reviewer` to name, and the reviewer is the only sub-agent on a pass that verifies anything. */
    'codeweaver-reviewer',
    'flowrider-reviewer',
    'siegemaster-reviewer',
    /** Siegemaster alone has a second named minion: a walk against a running system is driven by
     * hand, and no brief can stand in for the instructions that takes. */
    'siegemaster-walker',
  ],
  operatorRoleNames: ['codeweaver', 'flowrider', 'siegemaster'],
} as const;
