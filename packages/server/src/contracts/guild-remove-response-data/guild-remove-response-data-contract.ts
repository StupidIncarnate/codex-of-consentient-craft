/**
 * PURPOSE: Defines the `data` GuildRemoveResponder returns on success
 *
 * USAGE:
 * const data = guildRemoveResponseDataContract.parse(value);
 * // Returns validated GuildRemoveResponseData
 */

import { z } from '#gateway/npm/zod';

export const guildRemoveResponseDataContract = z
  .strictObject({ success: z.boolean() })
  .brand<'GuildRemoveResponseData'>();

export type GuildRemoveResponseData = z.infer<typeof guildRemoveResponseDataContract>;
