/**
 * PURPOSE: Defines the validated body shape returned by the GET /api/health endpoint
 *
 * USAGE:
 * const { status } = healthResponseContract.parse(body);
 * // Returns: { status: 'ok', timestamp: string }
 */

import { z } from 'zod';

export const healthResponseContract = z.object({
  status: z.string().min(1).brand<'HealthStatus'>(),
  timestamp: z.string().min(1).brand<'HealthTimestamp'>(),
});

export type HealthResponse = z.infer<typeof healthResponseContract>;
