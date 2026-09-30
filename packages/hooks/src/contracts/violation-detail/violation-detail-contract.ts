/**
 * PURPOSE: Zod schema for individual violation detail with location
 *
 * USAGE:
 * const detail = violationDetailContract.parse(detailData);
 * // Returns validated ViolationDetail with ruleId, line, column, message
 */
import { z } from '#gateway/npm/zod';

export const violationDetailContract = z
  .object({
    ruleId: z.string().min(1).brand<'ViolationDetailRuleId'>(),
    line: z.number().int().positive().brand<'ViolationDetailLine'>(),
    column: z.number().int().nonnegative().brand<'ViolationDetailColumn'>(),
    message: z.string().min(1).brand<'ViolationDetailMessage'>(),
  })
  .brand<'ViolationDetail'>();

export type ViolationDetail = z.infer<typeof violationDetailContract>;
