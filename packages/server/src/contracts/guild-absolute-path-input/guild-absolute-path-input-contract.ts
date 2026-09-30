/**
 * PURPOSE: Validates that a guild path handed to the add/update responders is absolute — starts with `/` or a drive letter and backslash
 *
 * USAGE:
 * guildAbsolutePathInputContract.safeParse({ path: '/projects/guild' }).success;
 * // Returns true; { path: 'jo' } returns false
 */

import { z } from '#gateway/npm/zod';

const ABSOLUTE_PATH_PATTERN = /^(?:\/|[A-Za-z]:\\)/u;

// The guild contract's `path` accepts any non-empty string, so this is the field that keeps a
// relative path out of config.json — once one is there, every guild list read reports it invalid.
export const guildAbsolutePathInputContract = z
  .object({
    path: z
      .string()
      .min(1)
      .regex(ABSOLUTE_PATH_PATTERN, 'Path must be absolute (start with / or C:\\ on Windows)')
      .brand<'GuildAbsolutePathInputPath'>(),
  })
  .brand<'GuildAbsolutePathInput'>();

export type GuildAbsolutePathInput = z.infer<typeof guildAbsolutePathInputContract>;
