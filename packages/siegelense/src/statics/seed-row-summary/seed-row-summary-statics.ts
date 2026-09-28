/**
 * PURPOSE: The generic vocabulary `startAnswerRenderTransformer` checks against a seeded row's own
 * keys to pick the fields that identify it to a reader on the `siegelense start` human view, and the
 * cap on how many it shows. Checked in this priority order regardless of the field order the recipe
 * that produced the row happened to declare, so a guild's own `name`/`urlSlug` and a quest's own
 * `title`/`status` both surface without either domain being named here — the vocabulary is generic
 * across every row shape a recipe can seed, not a list of per-recipe fields.
 *
 * `primaryId.fieldOrder` is the same idea for the id SLOT rather than the parenthetical: a `session`
 * row (`{sessionId, cwd, filePath, lineCount}`) and a `subagent` row (`{agentId, toolUseId, filePath,
 * lineCount}`) carry no field literally named `id` — checking `sessionId`/`agentId` after `id` is
 * what stops `guild-active-suite`'s own SEEDED lines from reading `subagent: -` / `session: -` with
 * nothing else to go on. `filePath` is in `identity.fieldOrder` for the identical reason: it is the
 * one field both of those rows DO share, so it is what fills the parenthetical once `sessionId` or
 * `agentId` has already claimed the id slot.
 *
 * USAGE:
 * seedRowSummaryStatics.identity.fieldOrder;
 * // Returns the priority list checked against a seeded row's own keys
 *
 * seedRowSummaryStatics.identity.maxFields;
 * // Returns 2
 *
 * seedRowSummaryStatics.primaryId.fieldOrder;
 * // Returns the priority list checked for the row's own id slot
 */

export const seedRowSummaryStatics = {
  identity: {
    fieldOrder: ['title', 'name', 'label', 'urlSlug', 'slug', 'status', 'state', 'filePath'],
    maxFields: 2,
  },
  primaryId: {
    fieldOrder: ['id', 'sessionId', 'agentId'],
  },
} as const;
