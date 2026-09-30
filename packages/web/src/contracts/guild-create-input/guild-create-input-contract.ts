/**
 * PURPOSE: Validates what the NEW GUILD form hands to CREATE. The path field refuses a path that is not
 * absolute (a leading / or a drive letter and backslash), so a relative path never reaches the create request.
 *
 * USAGE:
 * guildCreateInputContract.shape.path.safeParse('/home/user/my-guild').success;
 * // Returns true; 'jo' fails with 'Path must be absolute (start with / or C:\ on Windows)'
 */

import { z } from '#gateway/npm/zod';

export const guildCreateInputContract = z
  .object({
    path: z
      .string()
      .min(1)
      .refine((value) => value.startsWith('/') || /^[A-Za-z]:\\/u.test(value), {
        message: 'Path must be absolute (start with / or C:\\ on Windows)',
      })
      .brand<'GuildCreateInputPath'>(),
  })
  .brand<'GuildCreateInput'>();

export type GuildCreateInput = z.infer<typeof guildCreateInputContract>;
