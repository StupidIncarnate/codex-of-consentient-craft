/**
 * PURPOSE: Defines a branded number type for section item count display
 *
 * USAGE:
 * sectionCountContract.parse(5);
 * // Returns: SectionCount branded number
 */

import { z } from 'zod';

export const sectionCountContract = z.number().int().min(0).brand<'SectionCount'>();

export type SectionCount = z.infer<typeof sectionCountContract>;
