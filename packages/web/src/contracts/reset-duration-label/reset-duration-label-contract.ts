/**
 * PURPOSE: Branded string type for human-readable rate-limit reset durations like "2h5m" / "4d11h" / "15m"
 *
 * USAGE:
 * resetDurationLabelContract.parse('2h5m');
 * // Returns: branded ResetDurationLabel
 */
import { z } from 'zod';

export const resetDurationLabelContract = z.string().min(1).brand<'ResetDurationLabel'>();

export type ResetDurationLabel = z.infer<typeof resetDurationLabelContract>;
