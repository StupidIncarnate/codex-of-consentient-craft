/**
 * PURPOSE: Zod schema for an absolute path to a guild directory cwd (contains guild.json)
 *
 * USAGE:
 * const cwd = guildPathCwdContract.parse('/home/user/.dungeonmaster/guilds/my-guild');
 * // Returns branded GuildPathCwd type — only obtainable via cwdResolveBroker or this contract's parse
 */

import { absoluteFilePathContract } from '../absolute-file-path/absolute-file-path-contract';
import type { z } from 'zod';

export const guildPathCwdContract = absoluteFilePathContract.brand<'GuildPathCwd'>();

export type GuildPathCwd = z.infer<typeof guildPathCwdContract>;
