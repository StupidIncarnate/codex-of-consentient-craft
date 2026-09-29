/**
 * PURPOSE: Validates a formatted violation comparison message string
 *
 * USAGE:
 * const message = violationComparisonMessageContract.parse("🛑 New violations detected...");
 * // Returns branded ViolationComparisonMessage string
 */
import { z } from '#gateway/npm/zod';

export const violationComparisonMessageContract = z.string().brand<'ViolationComparisonMessage'>();

export type ViolationComparisonMessage = z.infer<typeof violationComparisonMessageContract>;
