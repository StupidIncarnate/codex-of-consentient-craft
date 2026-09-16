/**
 * PURPOSE: The values one op carries onto a row — each either a literal the ingredient's own
 * `fields` contract will judge, or a `SavedRef` the runner resolves first. Reach for this over a
 * bare record wherever a value may have come from `fromSaved`: a value carrying the `__savedRef`
 * marker is validated STRICTLY against `savedRefContract` here, rather than waved through as an
 * ordinary field and discovered malformed only once the runner tries to resolve it. A `z.union`
 * cannot do this — it falls through a failed first branch into `z.unknown()`, which accepts
 * anything, so a malformed saved ref parsed clean until this file stopped using one.
 *
 * USAGE:
 * fieldValuesContract.parse({ title: 'The running one' });
 * fieldValuesContract.parse({ userRequest: { __savedRef: true, name: 'origin' } });
 * // Returns FieldValues
 */
import { z } from 'zod';
import { fieldNameContract } from '../field-name/field-name-contract';
import { savedRefContract } from '../saved-ref/saved-ref-contract';
import type { SavedRef } from '../saved-ref/saved-ref-contract';

const fieldValueContract = z.unknown().superRefine((value, ctx) => {
  if (typeof value !== 'object' || value === null) {
    return;
  }

  if (Reflect.get(value, '__savedRef') !== true) {
    return;
  }

  const result = savedRefContract.safeParse(value);
  if (result.success) {
    return;
  }

  result.error.issues.forEach((issue) => {
    ctx.addIssue(issue);
  });
});

export const fieldValuesContract = z.record(fieldNameContract, fieldValueContract);

export type FieldValues = z.infer<typeof fieldValuesContract>;

/** The generic form `Settable` and a filter's `where` both narrow through: every field keeps its
 * own type, or may instead be a cross-link the runner resolves before the write. */
export type FieldValuesFor<TFields> = { [K in keyof TFields]?: TFields[K] | SavedRef };
