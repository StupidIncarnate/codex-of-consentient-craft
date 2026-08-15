/**
 * PURPOSE: Single source of truth for work-item role names — every role a work item may carry, the
 * subset that are interactive CHAT roles (a conversation the user drives, rather than a dispatched
 * execution session), the subset excluded from quest status derivation, and the subset that is the
 * POST-QUEST follow-up chat rather than the spec/design/bug intake chat the main composer drives.
 *
 * USAGE:
 * workItemRoleStatics.names;
 * // Returns the full role tuple workItemRoleContract builds its enum from.
 * workItemRoleStatics.chat;
 * // Returns the chat-role subset isChatWorkItemRoleGuard matches on.
 * workItemRoleStatics.excludedFromStatusDerivation;
 * // Returns the role subset workItemsToQuestStatusTransformer ignores when deriving quest status.
 * workItemRoleStatics.postQuestChat;
 * // Returns the chat-role subset isPostQuestChatWorkItemRoleGuard matches on.
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
 * `postQuestChat` names the chat roles whose conversation is NOT the thread the quest's main
 * composer resumes — they have their own composer, in the FOLLOW-UP tab. A selector looking for
 * "the chat thread the main composer resumes" must subtract this subset from `chat`; without it,
 * `tavernkeeper` would be picked up as if it were the spec/design/bug intake thread.
 *
 * Role semantics:
 * - `chaoswhisperer` — feature spec intake (/dumpster-create). Chat.
 * - `glyphsmith` — design intake. Chat.
 * - `bughunt` — bug-hunt regression intake (/dumpster-hunt), the chaoswhisperer counterpart. Chat.
 *   Distinct from `pesteater`, which Start Quest seeds as the bug-hunt implementation item.
 * - `tavernkeeper` — post-quest follow-up conversation about a finished quest. Chat, and the one
 *   member of `postQuestChat` — it is not the thread the main composer resumes; it has its own
 *   composer in the FOLLOW-UP tab. Alone among the roles it is also excluded from quest status
 *   derivation, because its item is created after the quest terminated and asking a question must
 *   not make a finished quest read as running again.
 * - `codeweaver` — implementation relay worker; one session per codeweaver operation item.
 * - `ward` — the only non-agent role (spawnerType 'command'); a quality gate run.
 * - `spiritmender` — inserted after a red ward to repair it.
 * - `flowrider` — verify operator that authors the flow-perspective test suites below the browser.
 * - `groundstomper` — verify operator that authors the Playwright e2e walk; one item per runtime
 *   flow that touches an e2e-eligible package.
 * - `siegemaster` — verify operator that hand-walks each flow; one item per flow.
 * - `blightscout` — the standards review, scoped to ONE commit and appended after every role that
 *   commits, rather than one whole-diff audit at the end. It runs alone and summons nothing: the
 *   surface it reviews is a single session's output, so there is no partition to fan out. Replaces
 *   `blightwarden` and its three minions, whose group/crosscut partitioning existed only because a
 *   170-file diff had to be cut into 29 groups.
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
    'groundstomper',
    'siegemaster',
    'blightscout',
    'pesteater',
    'warpgate',
  ],
  chat: ['chaoswhisperer', 'glyphsmith', 'bughunt', 'tavernkeeper'],
  excludedFromStatusDerivation: ['tavernkeeper'],
  postQuestChat: ['tavernkeeper'],
} as const;
