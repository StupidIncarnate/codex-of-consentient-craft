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
 * discipline pack. Each of the five operation-owning roles has its own prompt, and each summons
 * three minions named after it — `codeweaver-planner-minion`, `codeweaver-worker-minion`,
 * `codeweaver-reviewer-minion`, and the same three for `pesteater`, `flowrider`, `groundstomper`
 * and `siegemaster`. Twenty files, one per (role, phase).
 *
 * The generic trio this replaced — a `planner-minion` / `worker-minion` / `reviewer-minion` served
 * with a `$DISCIPLINE` placeholder a pack filled in — cost a reader two files and a substitution to
 * answer "what is this agent actually told". It also cost every session four answers it could not
 * use: a shared template that had to hedge across five kinds of work stated all five, and a
 * manual-QA worker was served eight sentences that were simply false for it, among them "your files
 * are the tests" to a session that writes no file at all.
 *
 * `roleNames` and `minionNames` are DISJOINT, and the mechanical stakes are unchanged: a minion
 * added to `roleNames` would widen `agentRoleContract` with a role no operation item can ever hold;
 * a role added to `minionNames` would let it fetch without a `workItemId` and escape
 * `subagentStopNeedsBlockGuard`, which is what holds a work-item session open until it signals.
 *
 * `operatorRoleNames` is the five roles that run a planner/worker/reviewer round. Membership is
 * READ from here rather than listed at each call site, so a sixth operator role is covered by the
 * signal-back gates and the prompt renderer the day it is added — the same reason
 * `isChatWorkItemRoleGuard` reads `workItemRoleStatics.chat` instead of growing an `||` chain. It
 * replaced `roleToDisciplineStatics`, whose keys were the only thing those call sites ever wanted.
 */

export const agentPromptClassificationStatics = {
  promptNames: [
    'chaoswhisperer-gap-minion',
    'codeweaver',
    'codeweaver-planner-minion',
    'codeweaver-worker-minion',
    'codeweaver-reviewer-minion',
    'pesteater',
    'pesteater-planner-minion',
    'pesteater-worker-minion',
    'pesteater-reviewer-minion',
    'flowrider',
    'flowrider-planner-minion',
    'flowrider-worker-minion',
    'flowrider-reviewer-minion',
    'groundstomper',
    'groundstomper-planner-minion',
    'groundstomper-worker-minion',
    'groundstomper-reviewer-minion',
    'siegemaster',
    'siegemaster-planner-minion',
    'siegemaster-worker-minion',
    'siegemaster-reviewer-minion',
    'spiritmender',
    'warpgate',
  ],
  roleNames: [
    /** The five operation-owning roles. Each one owns a work item, opens no source file, and drives
     * a round through its own three minions. Their prompts share no template — see
     * `operatorRoleNames` below, which is this same five for the call sites that only want
     * membership. */
    'codeweaver',
    'pesteater',
    'flowrider',
    'groundstomper',
    'siegemaster',
    /** Spiritmender — the relay worker dispatched on a ward red or a repairable riftcarver red. A
     * repair is not an operation grouping, so it runs no round and summons no minion. */
    'spiritmender',
    /** Warpgate — merge relay worker, dispatched from the ledger like any other role; lands the
     * quest branch on the base branch. `tavernkeeper` is deliberately absent from every list here —
     * chat roles are served by the chat prompt path, not by `get-agent-prompt`. */
    'warpgate',
  ],
  minionNames: [
    /** ChaosWhisperer summons this during the SPEC phase, long before any operation item exists. It
     * belongs to no round and has no planner/worker/reviewer siblings. */
    'chaoswhisperer-gap-minion',
    /** The three phases of one round, five times over. A minion's name carries its parent's role
     * because its prompt carries that role's subject matter — there is nothing generic left for a
     * bare `planner-minion` to name. */
    'codeweaver-planner-minion',
    'codeweaver-worker-minion',
    'codeweaver-reviewer-minion',
    'pesteater-planner-minion',
    'pesteater-worker-minion',
    'pesteater-reviewer-minion',
    'flowrider-planner-minion',
    'flowrider-worker-minion',
    'flowrider-reviewer-minion',
    'groundstomper-planner-minion',
    'groundstomper-worker-minion',
    'groundstomper-reviewer-minion',
    'siegemaster-planner-minion',
    'siegemaster-worker-minion',
    'siegemaster-reviewer-minion',
  ],
  operatorRoleNames: ['codeweaver', 'pesteater', 'flowrider', 'groundstomper', 'siegemaster'],
} as const;
