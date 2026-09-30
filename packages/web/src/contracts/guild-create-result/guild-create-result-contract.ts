/**
 * PURPOSE: Validates the wire body of POST /api/guilds — a single `id` confirming the guild was
 * created. `fetchJson` resolves `unknown`; this is what `guildCreateBroker` parses its response through.
 *
 * USAGE:
 * guildCreateResultContract.parse({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
 * // Returns { id: GuildId }
 */

import { guildContract } from '@dungeonmaster/shared/contracts';
import { z } from '#gateway/npm/zod';

export const guildCreateResultContract = z
  .object({
    id: guildContract.shape.id,
  })
  .brand<'GuildCreateResult'>();

export type GuildCreateResult = z.infer<typeof guildCreateResultContract>;
