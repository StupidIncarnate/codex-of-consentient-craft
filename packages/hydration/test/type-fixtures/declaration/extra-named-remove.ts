/**
 * D6 — an extra named `remove` must not compile, for the same reason as D5's `set`: a second
 * built-in verb an ingredient's own `extras` may not shadow. Counterpart:
 * `scrolls/seigelense/proto/declarations.ts`'s `extraShadowsVerb`, which declares `set` and
 * `remove` on the SAME fixture — split here because a fixture holds exactly one deliberate error.
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
