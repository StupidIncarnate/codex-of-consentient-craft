/**
 * PURPOSE: What a caller may supply to make a guild — its name and the directory it registers
 * against. Reach for this over its sibling, `guildContract`, on a route's INPUT side: the server
 * mints `id` and `urlSlug` inside `guildAddBroker`, so a caller can never set them and this
 * contract has no field for either. `guildContract` itself stays the guild ingredient's `record` —
 * what a route hands back once the row exists.
 *
 * USAGE:
 * guildFieldsContract.parse({ name: 'Guild 1', path: '/tmp/guilds-under-test/guild-1' });
 * // Returns GuildFields
 */
import type { z } from 'zod';

import { guildContract } from '@dungeonmaster/shared/contracts';

export const guildFieldsContract = guildContract.pick({ name: true, path: true });

export type GuildFields = z.infer<typeof guildFieldsContract>;
