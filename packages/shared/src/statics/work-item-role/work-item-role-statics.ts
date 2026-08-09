/**
 * PURPOSE: Single source of truth for work-item role names — every role a work item may carry, the
 * subset that are interactive CHAT roles (a conversation the user drives, rather than a dispatched
 * execution session), and the subset excluded from quest status derivation.
 *
 * USAGE:
 * workItemRoleStatics.names;
 * // Returns the full role tuple workItemRoleContract builds its enum from.
 * workItemRoleStatics.chat;
 * // Returns the chat-role subset isChatWorkItemRoleGuard matches on.
 * workItemRoleStatics.excludedFromStatusDerivation;
 * // Returns the role subset workItemsToQuestStatusTransformer ignores when deriving quest status.
 *
 * This is DATA only (statics may import statics, never brokers). The contract enum, the chat-role
 * guard, and the status-derivation transformer all read this tuple, so a role added here reaches
 * every consumer at once — including `it.each` role matrices, which derive their cases from `names`
 * instead of keeping a second copy that would silently skip the new member.
 *
 * `excludedFromStatusDerivation` names the roles whose work items `workItemsToQuestStatusTransformer`
 * ignores. It is scoped to the one role that needs it — a work item created after the quest already
 * terminated must not flip a finished quest back to running just because someone asked it a question.
 *
 * Role semantics:
 * - `chaoswhisperer` — feature spec intake (/dumpster-create). Chat.
 * - `glyphsmith` — design intake. Chat.
 * - `bughunt` — bug-hunt regression intake (/dumpster-hunt), the chaoswhisperer counterpart. Chat.
 *   Distinct from `pesteater`, which Start Quest seeds as the bug-hunt implementation item.
 * - `tavernkeeper` — post-quest follow-up conversation about a finished quest. Chat. Alone among the
 *   roles it is excluded from quest status derivation, because its item is created after the quest
 *   terminated and asking a question must not make a finished quest read as running again.
 * - `codeweaver` — implementation relay worker; one session per codeweaver operation item.
 * - `ward` — the only non-agent role (spawnerType 'command'); a quality gate run.
 * - `spiritmender` — inserted after a red ward to repair it.
 * - `flowrider` — verify operator that authors the flow-perspective test suites.
 * - `siegemaster` — verify operator that hand-walks each flow; one item per flow.
 * - `blightwarden` — verify operator running the whole-diff standards audit.
 * - `blightwarden-group-minion` / `blightwarden-crosscut-minion` — blightwarden's sub-agents.
 * - `pesteater` — bug-hunt implementation: writes a failing test first, then fixes it.
 * - `warpgate` — merges the quest branch home into the base branch. NOT chat: it is dispatched from
 *   the operations ledger like any relay role, and it is real work with a real failure mode.
 */

export const workItemRoleStatics = {
  names: [
    'chaoswhisperer',
    'glyphsmith',
    'bughunt',
    'tavernkeeper',
    'codeweaver',
    'ward',
    'spiritmender',
    'flowrider',
    'siegemaster',
    'blightwarden-group-minion',
    'blightwarden-crosscut-minion',
    'blightwarden',
    'pesteater',
    'warpgate',
  ],
  chat: ['chaoswhisperer', 'glyphsmith', 'bughunt', 'tavernkeeper'],
  excludedFromStatusDerivation: ['tavernkeeper'],
} as const;
