/**
 * PURPOSE: The generic vocabulary `startAnswerRenderTransformer` checks against a seeded row's own
 * keys to pick the fields that identify it to a reader on the `siegelense start` human view, and the
 * cap on how many it shows. Checked in this priority order regardless of the field order the recipe
 * that produced the row happened to declare, so a guild's own `name`/`urlSlug` and a quest's own
 * `title`/`status` both surface without either domain being named here — the vocabulary is generic
 * across every row shape a recipe can seed, not a list of per-recipe fields.
 *
 * USAGE:
 * seedRowSummaryStatics.identity.fieldOrder;
 * // Returns the priority list checked against a seeded row's own keys
 *
 * seedRowSummaryStatics.identity.maxFields;
 * // Returns 2
 */

export const seedRowSummaryStatics = {
  identity: {
    fieldOrder: ['title', 'name', 'label', 'urlSlug', 'slug', 'status', 'state'],
    maxFields: 2,
  },
} as const;
