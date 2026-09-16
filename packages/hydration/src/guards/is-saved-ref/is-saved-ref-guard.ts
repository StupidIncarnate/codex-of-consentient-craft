/**
 * PURPOSE: Answers whether a field value carries the `__savedRef` marker — the discriminant that
 * separates a cross-link `fromSaved` produced from an ordinary literal. Reach for this at a call
 * site (a transformer or broker) deciding what to DO with a value, over `savedRefContract.safeParse`,
 * which allocates a `ZodError` for the overwhelmingly common literal case. `fieldValuesContract`
 * encodes this same marker check inline, since a `contracts/` file may not import a guard.
 *
 * USAGE:
 * isSavedRefGuard({ value: { __savedRef: true, name: 'origin' } });
 * // Returns true
 */
export const isSavedRefGuard = ({ value }: { value?: unknown }): boolean => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return Reflect.get(value, '__savedRef') === true;
};
