/**
 * PURPOSE: Defines a branded string type for absolute file paths
 *
 * USAGE:
 * const path = absoluteFilePathContract.parse('/test/user-fetch-broker.ts');
 * // Returns a branded AbsoluteFilePath string type
 */
import { z } from 'zod';

export const absoluteFilePathContract = z.string().brand<'AbsoluteFilePath'>();

export type AbsoluteFilePath = z.infer<typeof absoluteFilePathContract>;
