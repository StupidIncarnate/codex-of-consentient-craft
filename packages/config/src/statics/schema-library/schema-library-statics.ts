/**
 * PURPOSE: Defines all supported schema validation library types
 *
 * USAGE:
 * import {schemaLibraryStatics} from './schema-library-statics';
 * const libraries = schemaLibraryStatics.libraries.all;
 * // Returns readonly array of all valid schema library names
 */

export const schemaLibraryStatics = {
  libraries: {
    all: ['zod', 'yup', 'joi', 'ajv'] as const,
  },
} as const;
