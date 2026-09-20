/**
 * PURPOSE: Flags a `locationsStatics` candidate value that is a bare filename extension —
 * `.json`, `.png`, `.sock` and similar — rather than a complete filename or dirname. Reach for
 * this over hand-rolling a regex against the leading dot: `.siegelense` and `.claude` share that
 * same shape and are genuine one-segment dotfile names, so only an explicit, named list of known
 * extensions (`genericLocationFragmentStatics`) tells the two apart.
 *
 * USAGE:
 * isKnownGenericLocationFragmentGuard({ value: '.json' });
 * // Returns true
 * isKnownGenericLocationFragmentGuard({ value: '.siegelense' });
 * // Returns false — a complete dotfile name, not an extension fragment
 */
import { genericLocationFragmentStatics } from '../../statics/generic-location-fragment/generic-location-fragment-statics';

export const isKnownGenericLocationFragmentGuard = ({ value }: { value?: string }): boolean => {
  if (!value) {
    return false;
  }
  return genericLocationFragmentStatics.extensions.some((extension) => extension === value);
};
