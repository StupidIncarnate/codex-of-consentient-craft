/**
 * PURPOSE: Validates the JSON Claude Code feeds to its statusline command, extracting only the rate_limits sub-object
 *
 * USAGE:
 * statuslineInputContract.parse(JSON.parse(stdinString));
 * // Returns the parsed shape; rate_limits and its sub-fields are all optional (Claude Code may omit them on free-tier accounts)
 */
import { z } from 'zod';

const rateLimitWindowShape = z
  .object({
    used_percentage: z.number().brand<'ClaudeUsedPercentage'>().optional(),
    resets_at: z.string().brand<'ClaudeResetsAt'>().optional(),
  })
  .optional();

export const statuslineInputContract = z
  .object({
    rate_limits: z
      .object({
        five_hour: rateLimitWindowShape,
        seven_day: rateLimitWindowShape,
      })
      .optional(),
  })
  .passthrough();

export type StatuslineInput = z.infer<typeof statuslineInputContract>;
