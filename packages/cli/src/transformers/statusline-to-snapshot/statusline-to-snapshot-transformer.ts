/**
 * PURPOSE: Converts parsed Claude Code statusline input into a RateLimitsSnapshot at a given timestamp
 *
 * USAGE:
 * const snapshot = statuslineToSnapshotTransformer({ input, nowIso: '2026-05-05T13:00:00.000Z' });
 * // Returns RateLimitsSnapshot with both windows null when Claude Code omits them
 */

import {
  rateLimitsSnapshotContract,
  type RateLimitsSnapshot,
} from '@dungeonmaster/shared/contracts';

import type { StatuslineInput } from '../../contracts/statusline-input/statusline-input-contract';
import { statuslineWindowToRateLimitWindowTransformer } from '../statusline-window-to-rate-limit-window/statusline-window-to-rate-limit-window-transformer';

export const statuslineToSnapshotTransformer = ({
  input,
  nowIso,
}: {
  input: StatuslineInput;
  nowIso: string;
}): RateLimitsSnapshot => {
  const fiveHour = input.rate_limits?.five_hour
    ? statuslineWindowToRateLimitWindowTransformer({ raw: input.rate_limits.five_hour })
    : null;
  const sevenDay = input.rate_limits?.seven_day
    ? statuslineWindowToRateLimitWindowTransformer({ raw: input.rate_limits.seven_day })
    : null;

  return rateLimitsSnapshotContract.parse({
    fiveHour,
    sevenDay,
    updatedAt: nowIso,
  });
};
