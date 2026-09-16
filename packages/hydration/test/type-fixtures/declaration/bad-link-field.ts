/**
 * D8 — a link's `as` naming no field on this row must not compile.
 * Counterpart: `scrolls/seigelense/proto/declarations.ts`'s `badLinkField`, which marks the
 * `links` line `@ts-expect-error 'notAField' is not on 'fields'`.
 */
import { dmIngredient, sampleFields, sampleRecordContract, write } from './_shared';

export const badLinkField = dmIngredient({
  name: 'bad-link-field',
  description: "a link's as naming no field on this row",
  fields: sampleFields,
  record: sampleRecordContract,
  links: [{ of: 'somewhere', as: 'notAField' }],
  routes: { write },
  copies: 'x',
});
