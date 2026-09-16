/**
 * D4 — an ingredient with no routes at all must not compile.
 * Counterpart: `scrolls/seigelense/proto/declarations.ts`'s `noRoutes`, which marks the
 * declaration `@ts-expect-error an ingredient nothing can make is not an ingredient`.
 */
import { dmIngredient, sampleFields, sampleRecordContract } from './_shared';

export const noRoutes = dmIngredient({
  name: 'no-routes',
  description: 'an ingredient nothing can make is not an ingredient',
  fields: sampleFields,
  record: sampleRecordContract,
  routes: {},
});
