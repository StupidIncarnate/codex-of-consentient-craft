/**
 * D3 — a `write` route with no `copies:` must not compile.
 * Counterpart: `scrolls/seigelense/siegelense-recipes.md`'s "the ten malformed declarations" table,
 * row 3, "a `write` route with no `copies:`".
 */
import { dmIngredient, sampleFields, sampleRecordContract, write } from './_shared';

export const writeWithoutCopies = dmIngredient({
  name: 'write-without-copies',
  description: 'a write route with nothing to compare against',
  fields: sampleFields,
  record: sampleRecordContract,
  routes: { write },
});
