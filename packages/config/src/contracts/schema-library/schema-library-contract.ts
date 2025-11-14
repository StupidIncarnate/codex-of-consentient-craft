/**
 * PURPOSE: Validates and defines schema library type for project configuration
 *
 * USAGE:
 * import {schemaLibraryContract} from './schema-library-contract';
 * const library = schemaLibraryContract.parse('zod');
 * // Returns validated SchemaLibrary type
 */

import { z } from 'zod';
import { schemaLibraryStatics } from '../../statics/schema-library/schema-library-statics';

export const schemaLibraryContract = z.enum(schemaLibraryStatics.libraries.all);
export type SchemaLibrary = z.infer<typeof schemaLibraryContract>;
