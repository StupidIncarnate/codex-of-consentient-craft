/**
 * D8 — a link's `as` naming no field on this row must not compile.
 * Counterpart: `scrolls/seigelense/siegelense-recipes.md`'s "the ten malformed declarations" table,
 * row 8, "`links.as` naming no field".
 */
import { dmIngredient, sampleFields, sampleRecordContract, write } from './_shared';

export const badLinkField = dmIngredient({
  name: 'bad-link-field',
  description: "a link's as naming no field on this row",
  fields: sampleFields,
  record: sampleRecordContract,
  links: [{ of: 'somewhere', as: 'notAField' }],
  routes: { write },
  copies: 'x',
});
