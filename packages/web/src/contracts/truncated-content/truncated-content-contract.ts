/**
 * PURPOSE: Defines a branded string type for content that has been truncated at display thresholds
 *
 * USAGE:
 * truncatedContentContract.parse('first 200 chars...');
 * // Returns: TruncatedContent branded string
 */

import { z } from 'zod';

export const truncatedContentContract = z.string().brand<'TruncatedContent'>();

export type TruncatedContent = z.infer<typeof truncatedContentContract>;
