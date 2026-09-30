/**
 * PURPOSE: What `linkValuesTransformer` answers for one row's foreign keys — either the resolved
 * field values every declared link fills, or the name of the first ancestor a link needs that the
 * row's own ancestor chain does not supply. Reach for this over a bare `FieldValues` return: a row
 * added at the TOP LEVEL whose `links` nothing supplies compiles clean — `Entry<R>` hands out a
 * collection for every registered ingredient regardless of nesting — so this is the shape that lets
 * a pure transformer name the gap instead of silently writing `undefined` into the link field.
 *
 * USAGE:
 * linkValuesResultContract.parse({ ok: true, values: { guildId: 'g1' } });
 * linkValuesResultContract.parse({ ok: false, missingParentName: 'guild' });
 * // Returns LinkValuesResult
 */
import { z } from '#gateway/npm/zod';
import { fieldValuesContract } from '../field-values/field-values-contract';

export const linkValuesResultContract = z.discriminatedUnion('ok', [
  z.object({ ok: z.literal(true), values: fieldValuesContract }).brand<'LinkValuesResult'>(),
  z
    .object({
      ok: z.literal(false),
      missingParentName: z
        .string()
        .min(1)
        .regex(
          /^[A-Za-z][A-Za-z0-9-]*$/u,
          'must start with a letter and hold only letters, digits and hyphens — the character set a RowRef segment can encode',
        )
        .brand<'LinkValuesResultMissingParentName'>(),
    })
    .brand<'LinkValuesResult'>(),
]);

export type LinkValuesResult = z.infer<typeof linkValuesResultContract>;
