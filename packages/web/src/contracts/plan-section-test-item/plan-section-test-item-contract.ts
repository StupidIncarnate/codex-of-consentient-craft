/**
 * PURPOSE: Defines a branded type for plan section test item data
 *
 * USAGE:
 * planSectionTestItemContract.parse({ text: 'step-a' });
 * // Returns: PlanSectionTestItem branded object
 */

import { z } from 'zod';

export const planSectionTestItemContract = z
  .object({
    text: z.string().min(1),
  })
  .brand<'PlanSectionTestItem'>();

export type PlanSectionTestItem = z.infer<typeof planSectionTestItemContract>;
