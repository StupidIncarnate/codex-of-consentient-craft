/**
 * D2 — `transitions.to` holding a value that field cannot take must not compile.
 * Counterpart: `scrolls/seigelense/siegelense-recipes.md`'s "the ten malformed declarations" table,
 * row 2, "`transitions.to` holding a value that field cannot take".
 *
 * `reach: walk` — see `bad-transition-field.ts`'s header for why a bare reference, not an inline
 * destructured arrow, keeps this fixture to its one deliberate error.
 */
import { dmIngredient, sampleFields, sampleRecordContract, write, walk } from './_shared';

export const badTransitionValue = dmIngredient({
  name: 'bad-transition-value',
  description: 'a transition naming a value its own field cannot take',
  fields: sampleFields,
  record: sampleRecordContract,
  transitions: {
    field: 'status',
    to: ['queued', 'ZZZ_not_a_status'],
    reach: walk,
  },
  routes: { write },
  copies: 'x',
});
