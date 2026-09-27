/**
 * PURPOSE: The real `location` singleton `#gateway/browser/location` passes through — there is
 * nothing to construct beyond it, so this hands back the genuine object rather than a fake one.
 *
 * USAGE:
 * const realLocation = LocationStub();
 * // Returns globalThis.location, unchanged
 */
import { location } from './location';

export const LocationStub = (): Location => location;
