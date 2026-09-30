/**
 * PURPOSE: Defines the validated body shape for the guild-add responder
 *
 * USAGE:
 * const { name, path } = guildAddBodyContract.parse(body);
 * // Returns: { name: GuildName, path: GuildPath }
 */

import { z } from '#gateway/npm/zod';

import { guildAddBodyStatics } from '../../statics/guild-add-body/guild-add-body-statics';

export const guildAddBodyContract = z
  .object({
    name: z
      .string()
      .min(1)
      .max(guildAddBodyStatics.limits.nameMaxLength)
      .brand<'GuildAddBodyName'>(),
    path: z.string().min(1).brand<'GuildAddBodyPath'>(),
  })
  .brand<'GuildAddBody'>();

export type GuildAddBody = z.infer<typeof guildAddBodyContract>;
