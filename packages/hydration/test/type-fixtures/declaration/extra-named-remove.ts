/**
 * D6 — an extra named `remove` must not compile, for the same reason as D5's `set`: a second
 * built-in verb an ingredient's own `extras` may not shadow. Counterpart:
 * `scrolls/seigelense/siegelense-recipes.md`'s "the ten malformed declarations" table, row 6, "an
 * extra named `remove`".
 */
import { z } from 'zod';
import { dmIngredient, sampleFields, sampleRecordContract, write } from './_shared';

export const extraNamedRemove = dmIngredient({
  name: 'extra-named-remove',
  description: 'an extra whose name shadows the framework verb remove',
  fields: sampleFields,
  record: sampleRecordContract,
  routes: { write },
  copies: 'x',
  extras: {
    remove: { args: z.object({ hard: z.boolean() }), apply: (): unknown => undefined },
  },
});
