/**
 * D5 — an extra named `set` must not compile: it shadows a built-in verb `reservedVerbStatics`
 * reserves to the framework. Counterpart: `scrolls/seigelense/siegelense-recipes.md`'s "the ten
 * malformed declarations" table, row 5, "an extra named `set`".
 */
import { z } from 'zod';
import { dmIngredient, sampleFields, sampleRecordContract, write } from './_shared';

export const extraNamedSet = dmIngredient({
  name: 'extra-named-set',
  description: 'an extra whose name shadows the framework verb set',
  fields: sampleFields,
  record: sampleRecordContract,
  routes: { write },
  copies: 'x',
  extras: {
    set: { args: z.object({ depth: z.number().brand<'ChainDepth'>() }), apply: (): unknown => undefined },
  },
});
