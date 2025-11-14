/**
 * PURPOSE: Validates if a value is a valid routing library type
 *
 * USAGE:
 * isValidRoutingLibraryGuard({library: 'react-router-dom'});
 * // Returns true if library is valid, false otherwise
 */

import { isInReadonlyArrayGuard } from '../is-in-readonly-array/is-in-readonly-array-guard';
import { routingLibraryStatics } from '../../statics/routing-library/routing-library-statics';

export const isValidRoutingLibraryGuard = ({ library }: { library?: unknown }): boolean =>
  isInReadonlyArrayGuard({ value: library, array: routingLibraryStatics.libraries.all });
