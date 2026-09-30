/**
 * PURPOSE: One summary line for one seeded binding — its id, plus the `seedRowSummaryStatics`
 * identity fields the row carries. Shared by the `start` human view (`SEEDED:` block) and the
 * `results` human view of a `seed` step, so the two can never describe the same binding differently.
 * A bare-id binding renders as just that id; there is no row to summarise.
 *
 * USAGE:
 * seedBindingLineTransformer({ binding: ContentTextStub({ value: 'quest' }), value: { id: 'q1', title: 'Add Auth', status: 'created' } });
 * // Returns '  quest: q1 (title: Add Auth, status: created)'
 */

import { seedRowSummaryStatics } from '../../statics/seed-row-summary/seed-row-summary-statics';

export const seedBindingLineTransformer = ({
  binding,
  value,
}: {
  binding: string;
  value: string | Record<string, unknown> | undefined;
}): string => {
  if (typeof value === 'string') {
    return `  ${binding}: ${value}`;
  }
  if (value === undefined) {
    return `  ${binding}: -`;
  }

  const rowEntries = Object.entries(value);
  const idEntry = seedRowSummaryStatics.primaryId.fieldOrder.reduce<
    (typeof rowEntries)[0] | undefined
  >((found, fieldName) => {
    if (found !== undefined) {
      return found;
    }
    return rowEntries.find(
      ([key, fieldValue]) => key === fieldName && typeof fieldValue === 'string',
    );
  }, undefined);
  const id = idEntry !== undefined && typeof idEntry[1] === 'string' ? idEntry[1] : '-';

  const identityEntries = seedRowSummaryStatics.identity.fieldOrder.reduce<typeof rowEntries>(
    (accumulated, fieldName) => {
      if (accumulated.length >= seedRowSummaryStatics.identity.maxFields) {
        return accumulated;
      }
      const match = rowEntries.find(
        ([key, fieldValue]) => key === fieldName && typeof fieldValue === 'string',
      );
      return match === undefined ? accumulated : [...accumulated, match];
    },
    [],
  );

  const identitySuffix =
    identityEntries.length === 0
      ? ''
      : ` (${identityEntries
          .map(([key, fieldValue]) => `${key}: ${String(fieldValue)}`)
          .join(', ')})`;

  return `  ${binding}: ${id}${identitySuffix}`;
};
