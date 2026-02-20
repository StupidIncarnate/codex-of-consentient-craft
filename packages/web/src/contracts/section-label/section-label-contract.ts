/**
 * PURPOSE: Defines a branded string type for section header label text
 *
 * USAGE:
 * sectionLabelContract.parse('OBJECTIVES');
 * // Returns: SectionLabel branded string
 */

import { z } from 'zod';

export const sectionLabelContract = z.string().min(1).brand<'SectionLabel'>();

export type SectionLabel = z.infer<typeof sectionLabelContract>;
