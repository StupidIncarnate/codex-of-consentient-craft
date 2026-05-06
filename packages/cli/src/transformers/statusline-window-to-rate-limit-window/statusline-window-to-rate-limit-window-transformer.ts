/**
 * PURPOSE: Converts a Claude Code statusline rate_limits window (snake_case) into the camelCase RateLimitWindow contract, returning null when fields are missing
 *
 * USAGE:
 * statuslineWindowToRateLimitWindowTransformer({ raw: { used_percentage: 42, resets_at: '2026-05-05T15:00:00.000Z' } });
 * // Returns RateLimitWindow object, or null if either field is missing
 */

import { rateLimitWindowContract, type RateLimitWindow } from '@dungeonmaster/shared/contracts';

export const statuslineWindowToRateLimitWindowTransformer = ({
  raw,
}: {
  raw: { used_percentage?: number | undefined; resets_at?: string | undefined };
}): RateLimitWindow | null => {
  const usedPercentage = raw.used_percentage;
  const resetsAt = raw.resets_at;
  if (usedPercentage === undefined || resetsAt === undefined) {
    return null;
  }

  return rateLimitWindowContract.parse({
    usedPercentage,
    resetsAt,
  });
};
