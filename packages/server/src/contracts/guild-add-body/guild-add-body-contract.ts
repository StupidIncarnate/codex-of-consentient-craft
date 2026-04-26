/**
 * PURPOSE: Defines the validated body shape for the guild-add responder
 *
 * USAGE:
 * const { name, path } = guildAddBodyContract.parse(body);
 * // Returns: { name: GuildName, path: GuildPath }
 */

import { z } from 'zod';
import { guildNameContract, guildPathContract } from '@dungeonmaster/shared/contracts';

export const guildAddBodyContract = z.object({
  name: guildNameContract,
  path: guildPathContract,
});

export type GuildAddBody = z.infer<typeof guildAddBodyContract>;
