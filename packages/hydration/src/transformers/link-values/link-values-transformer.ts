/**
 * PURPOSE: Builds the foreign-key values one row needs from the records its ancestors already
 * produced, or names the first link no ancestor can fill — including a row added at the TOP LEVEL,
 * which `Entry<R>` hands a collection for regardless of nesting, so the type system lets it compile
 * clean. Reach for this, never a hand-passed parent id: declared once per ingredient, a link is
 * never passed by hand and never forgotten. An explicit field on the row's own `fields` beats an
 * ancestor-derived value — a link whose `as` name already appears there is skipped entirely, which
 * is what makes `under({ guildId })`'s caller-supplied id outrank anything this transformer would
 * otherwise infer.
 *
 * USAGE:
 * linkValuesTransformer({
 *   links: [LinkSpecStub({ of: 'guild', as: 'guildId' })],
 *   ancestors: [RowRefStub({ value: 'guild[0:0]' })],
 *   ownFields: {},
 *   records: new Map([[RowRefStub({ value: 'guild[0:0]' }), { id: 'g1' }]]),
 * });
 * // Returns { ok: true, values: { guildId: 'g1' } }
 */
import { linkValuesResultContract } from '../../contracts/link-values-result/link-values-result-contract';
import type { LinkValuesResult } from '../../contracts/link-values-result/link-values-result-contract';
import type { LinkSpec } from '../../contracts/link-spec/link-spec-contract';
import type { RowRef } from '../../contracts/row-ref/row-ref-contract';
import type { FieldValues } from '../../contracts/field-values/field-values-contract';
import { rowRefIngredientTransformer } from '../row-ref-ingredient/row-ref-ingredient-transformer';

export const linkValuesTransformer = ({
  links,
  ancestors,
  ownFields,
  records,
}: {
  links: readonly LinkSpec[];
  ancestors: readonly RowRef[];
  ownFields: FieldValues;
  records: Map<RowRef, unknown>;
}): LinkValuesResult => {
  const values: Record<string, unknown> = {};

  for (const link of links) {
    if (link.as in ownFields) {
      continue;
    }

    const ancestorRef = ancestors.find(
      (ref) => rowRefIngredientTransformer({ rowRef: ref }) === link.of,
    );
    if (ancestorRef === undefined) {
      return linkValuesResultContract.parse({ ok: false, missingParentName: link.of });
    }

    const ancestorRecord = records.get(ancestorRef);
    const fromField = link.from ?? 'id';
    values[link.as] =
      typeof ancestorRecord === 'object' && ancestorRecord !== null
        ? (ancestorRecord as Record<PropertyKey, unknown>)[fromField]
        : undefined;
  }

  return linkValuesResultContract.parse({ ok: true, values });
};
