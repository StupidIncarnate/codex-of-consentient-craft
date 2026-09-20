/**
 * D1 — a `transitions.field` naming no field on this ingredient's own `fields` must not compile.
 * Counterpart: `scrolls/seigelense/siegelense-recipes.md`'s "the ten malformed declarations" table,
 * row 1, "`transitions.field` naming no field".
 *
 * `reach: walk` — a bare reference, not an inline destructured arrow — is deliberate: once
 * `field: 'nonexistent'` fails every branch of `TransitionSpecWithReachFor`'s distributive union,
 * an inline `({ from, to, target, record }) => …` loses its contextual type entirely and adds four
 * collateral `TS7031` diagnostics for the now-untyped destructured parameters. `walk` already
 * carries its own fully-written type, so assigning it needs no context from the union at all —
 * this fixture holds exactly the one deliberate error.
 */
import { dmIngredient, sampleFields, sampleRecordContract, write, walk } from './_shared';

export const badTransitionField = dmIngredient({
  name: 'bad-transition-field',
  description: 'a transition naming a field this ingredient does not have',
  fields: sampleFields,
  record: sampleRecordContract,
  transitions: {
    field: 'nonexistent',
    to: ['queued'],
    reach: walk,
  },
  routes: { write },
  copies: 'x',
});
