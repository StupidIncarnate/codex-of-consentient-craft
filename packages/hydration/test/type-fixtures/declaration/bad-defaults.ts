/**
 * D7 — `defaults` returning a field that does not exist on `fields` must not compile.
 * Counterpart: `scrolls/seigelense/proto/declarations.ts`'s `badDefaults`, which marks the
 * `defaults` line `@ts-expect-error 'notAField' is not on 'fields'`.
 */
import { dmIngredient, sampleFields, sampleRecordContract, write } from './_shared';

export const badDefaults = dmIngredient({
  name: 'bad-defaults',
  description: 'defaults returning a field this ingredient does not have',
  fields: sampleFields,
  record: sampleRecordContract,
  defaults: () => ({ notAField: 1 }),
  routes: { write },
  copies: 'x',
});
