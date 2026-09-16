/**
 * D3 — a `write` route with no `copies:` must not compile.
 * Counterpart: `scrolls/seigelense/proto/declarations.ts`'s `writeWithoutCopies`, which marks the
 * declaration `@ts-expect-error a 'write' route with nothing to compare against`.
 */
import { dmIngredient, sampleFields, sampleRecordContract, write } from './_shared';

export const writeWithoutCopies = dmIngredient({
  name: 'write-without-copies',
  description: 'a write route with nothing to compare against',
  fields: sampleFields,
  record: sampleRecordContract,
  routes: { write },
});
