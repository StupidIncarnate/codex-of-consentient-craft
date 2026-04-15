/**
 * PURPOSE: Zod schema for pathish string fragments without prefix validation (not committed to absolute or relative)
 *
 * USAGE:
 * const seg = pathSegmentContract.parse('src/guards');
 * // Returns branded PathSegment string for bare path fragments, basenames, sub-paths, and display paths
 */

import { z } from 'zod';

export const pathSegmentContract = z.string().brand<'PathSegment'>();

export type PathSegment = z.infer<typeof pathSegmentContract>;
