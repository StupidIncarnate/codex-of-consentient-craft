/**
 * PURPOSE: Validates subdirectory name for integration test environments
 *
 * USAGE:
 * import {subdirNameContract} from './subdir-name-contract';
 * const subdir = subdirNameContract.parse('src');
 * // Returns validated SubdirName type
 */

import { z } from 'zod';

export const subdirNameContract = z.string().brand<'SubdirName'>();

export type SubdirName = z.infer<typeof subdirNameContract>;
