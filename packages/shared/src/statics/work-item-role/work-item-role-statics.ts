/**
 * PURPOSE: Single source of truth for work-item role names — every role a work item may carry, and
 * the subset that are interactive CHAT roles (a conversation the user drives, rather than a
 * dispatched execution session).
 *
 * USAGE:
 * workItemRoleStatics.names;
 * // Returns the full role tuple workItemRoleContract builds its enum from.
 * workItemRoleStatics.chat;
 * // Returns the chat-role subset isChatWorkItemRoleGuard matches on.
 *
 * This is DATA only (statics may import statics, never brokers). Both the contract enum and the
 * chat-role guard read this tuple, so a role added here reaches every consumer at once — including
 * `it.each` role matrices, which derive their cases from `names` instead of keeping a second copy
 * that would silently skip the new member.
 *
 * Role semantics:
 * - `chaoswhisperer` — feature spec intake (/dumpster-create). Chat.
 * - `glyphsmith` — design intake. Chat.
 * - `bughunt` — bug-hunt regression intake (/dumpster-hunt), the chaoswhisperer counterpart. Chat.
 *   Distinct from `pesteater`, which Start Quest seeds as the bug-hunt implementation item.
 * - `codeweaver` — implementation relay worker; one session per codeweaver operation item.
 * - `ward` — the only non-agent role (spawnerType 'command'); a quality gate run.
 * - `spiritmender` — inserted after a red ward to repair it.
 * - `flowrider` — verify operator that authors the flow-perspective test suites.
 * - `siegemaster` — verify operator that hand-walks each flow; one item per flow.
 * - `blightwarden` — verify operator running the whole-diff standards audit.
 * - `blightwarden-minion` / `blightwarden-crosscut-minion` — blightwarden's sub-agents.
 * - `pesteater` — bug-hunt implementation: writes a failing test first, then fixes it.
 */

export const workItemRoleStatics = {
  names: [
    'chaoswhisperer',
    'glyphsmith',
    'bughunt',
    'codeweaver',
    'ward',
    'spiritmender',
    'flowrider',
    'siegemaster',
    'blightwarden-minion',
    'blightwarden-crosscut-minion',
    'blightwarden',
    'pesteater',
  ],
  chat: ['chaoswhisperer', 'glyphsmith', 'bughunt'],
} as const;
