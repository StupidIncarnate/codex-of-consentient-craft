/**
 * PURPOSE: A merge is appended to the operations ledger at the user's request, at merge time — not
 * minted by a route the way every other family's scopes are. `questFlowStatics`' `warpgate` family
 * carries no `text` for exactly that reason, so the merge operation item's text lives here instead,
 * letting the merge responder read it rather than hardcode the sentence inline.
 *
 * USAGE:
 * warpgateOperationStatics.text;
 * // Returns 'Warpgate: merge the quest branch home into the base branch'
 */

export const warpgateOperationStatics = {
  text: 'Warpgate: merge the quest branch home into the base branch',
} as const;
