/**
 * PURPOSE: The data the signal-back handler needs to append a standards review next to the work it
 * reviews — the scout operation item's text TEMPLATE, and WHICH roles finishing a session earn one.
 * Reach for this rather than `warpgateOperationStatics` (the other ledger item minted outside the
 * Start-Quest seed) when the append is automatic and per-commit rather than a user pressing
 * Teleport once on a finished quest.
 *
 * USAGE:
 * blightscoutOperationStatics.textTemplate.replace(
 *   blightscoutOperationStatics.placeholders.reviewedOperation,
 *   `${role} ${operationItemId}`,
 * );
 * // Returns the ledger text for a review of THAT one session's commit.
 *
 * The text is a TEMPLATE, not a flat sentence, and the substituted tail is load-bearing rather than
 * decorative. `operationPtChainTransformer` keys a pt-continuation chain on ROLE + BASE TEXT, and
 * `slotManagerStatics.blightscout.maxAttempts` bounds a chain — so one shared sentence would make
 * every scout on a quest ONE chain, and the fourth review to signal `partial` would trip the
 * spent-budget halt and block a quest with its whole verify tail still ahead of it. Naming the
 * reviewed operation item is what makes the budget PER COMMIT, which is the only reading of it that
 * matches what a scout is scoped to (`get-blight-checklist({ scope: 'commit' })`). The suffix
 * follows `relayTailFanOutTransformer`'s `— flow: <id>` / `— package: <name>` precedent for the
 * same reason those exist: a per-item scope in the text is what gives a per-item budget.
 *
 * The substituted handle is the reviewed item's ROLE plus its OPERATION ITEM ID: the id because it
 * is the only thing that is unique per commit AND stable across the scout's own `pt N` continuation
 * (a sibling's text can repeat — two spiritmender items appended by two ward reds carry the same
 * sentence), and the role because a bare uuid tells a human scanning `get-quest` nothing about
 * which session's commit is under review.
 *
 * `committingRoles` is expansion data, the same way `fanOutBy` on a `questTypeRegistryStatics`
 * entry is: the responder tests MEMBERSHIP and learns no role name, so teaching a new role to earn
 * a review means adding it here rather than growing an `||` chain at the call site.
 *
 * Membership is exactly "this role's session ends in a commit of its own":
 *
 * - Every COMMAND role (`workItemRoleStatics.command` — `ward`, `riftcarver`) is absent because it
 *   is `spawnerType: 'command'`: a gate run or a workspace-preparation sequence the dispatcher
 *   executes itself, not a session, and neither writes code a scout could review.
 * - Every CHAT role (`workItemRoleStatics.chat`) is absent for the same reason: an intake or
 *   follow-up conversation produces a spec, not a commit.
 * - `warpgate` is absent because its commit is a MERGE of commits every earlier scout already
 *   reviewed, and it runs after the ledger has drained — a review appended there would reopen a
 *   quest the user just merged.
 *
 * `blightscout` ITSELF is absent, and that absence is the relay's TERMINATION PROOF rather than an
 * oversight: the append fires on membership alone, so a scout completing can never mint another
 * scout, and the chain is bounded at one review per committing session by construction. The
 * colocated test pins that absence directly, so it cannot be lost to a well-meaning edit.
 */

export const blightscoutOperationStatics = {
  textTemplate:
    'Blightscout: review the commit this session just landed against the five standards concerns — commit: {reviewedOperation}',
  placeholders: {
    reviewedOperation: '{reviewedOperation}',
  },
  committingRoles: [
    'codeweaver',
    'flowrider',
    'groundstomper',
    'siegemaster',
    'pesteater',
    'spiritmender',
  ],
} as const;
