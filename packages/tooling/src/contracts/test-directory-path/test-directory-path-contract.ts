/**
 * PURPOSE: Defines a branded string type for test directory paths with validation.
 *
 * USAGE:
 * const dirPath = testDirectoryPathContract.parse('/path/to/tests');
 * // Returns: TestDirectoryPath (branded non-empty string)
 */
import { z } from 'zod';

export const testDirectoryPathContract = z.string().min(1).brand<'TestDirectoryPath'>();

export type TestDirectoryPath = z.infer<typeof testDirectoryPathContract>;
