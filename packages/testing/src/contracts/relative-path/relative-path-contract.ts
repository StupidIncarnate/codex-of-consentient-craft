/**
 * PURPOSE: Validates relative file path strings for test environment
 *
 * USAGE:
 * import {relativePathContract} from './relative-path-contract';
 * const path = relativePathContract.parse('.claude/settings.json');
 * // Returns validated RelativePath type
 */

import { z } from 'zod';

export const relativePathContract = z.string().brand<'RelativePath'>();

export type RelativePath = z.infer<typeof relativePathContract>;
