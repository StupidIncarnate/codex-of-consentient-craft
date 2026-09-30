/**
 * PURPOSE: Defines the `data` GuildListResponder returns on success
 *
 * USAGE:
 * const data = guildListResponseDataContract.parse(value);
 * // Returns validated GuildListResponseData
 */

import { z } from '#gateway/npm/zod';
import { guildListItemContract } from '@dungeonmaster/shared/contracts';

export const guildListResponseDataContract = z.array(guildListItemContract);

export type GuildListResponseData = z.infer<typeof guildListResponseDataContract>;
