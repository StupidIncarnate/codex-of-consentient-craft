/**
 * PURPOSE: Validates if a value is a valid schema library type
 *
 * USAGE:
 * isValidSchemaLibraryGuard({library: 'zod'});
 * // Returns true if library is valid, false otherwise
 */

import { isInReadonlyArrayGuard } from '../is-in-readonly-array/is-in-readonly-array-guard';
import { schemaLibraryStatics } from '../../statics/schema-library/schema-library-statics';

export const isValidSchemaLibraryGuard = ({ library }: { library?: unknown }): boolean =>
  isInReadonlyArrayGuard({ value: library, array: schemaLibraryStatics.libraries.all });
