/**
 * D7 — `defaults` returning a field that does not exist on `fields` must not compile.
 * Counterpart: `scrolls/seigelense/siegelense-recipes.md`'s "the ten malformed declarations" table,
 * row 7, "`defaults` returning a field that does not exist".
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
