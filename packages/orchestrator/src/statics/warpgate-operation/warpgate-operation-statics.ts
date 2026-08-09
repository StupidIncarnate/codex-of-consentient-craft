/**
 * PURPOSE: A merge is appended to the operations ledger at the user's request, at merge time —
 * not seeded from `questTypeRegistryStatics` like every relay-tail item, which is authored once at
 * spec/Start time. The warpgate operation item's text has no home in that registry, so it lives
 * here instead, letting the merge responder read it rather than hardcode the sentence inline.
 *
 * USAGE:
 * warpgateOperationStatics.text;
 * // Returns 'Warpgate: merge the quest branch home into the base branch'
 */

export const warpgateOperationStatics = {
  text: 'Warpgate: merge the quest branch home into the base branch',
} as const;
