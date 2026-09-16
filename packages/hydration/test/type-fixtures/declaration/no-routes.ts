/**
 * D4 — an ingredient with no routes at all must not compile.
 * Counterpart: `scrolls/seigelense/siegelense-recipes.md`'s "the ten malformed declarations" table,
 * row 4, "no routes at all".
 */
import { dmIngredient, sampleFields, sampleRecordContract } from './_shared';

export const noRoutes = dmIngredient({
  name: 'no-routes',
  description: 'an ingredient nothing can make is not an ingredient',
  fields: sampleFields,
  record: sampleRecordContract,
  routes: {},
});
