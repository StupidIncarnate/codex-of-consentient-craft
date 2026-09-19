/**
 * PURPOSE: The records a recipe produces when run — key-value pairs where both keys and values
 * are ContentText. Used to represent the output of a recipe run (e.g. seeded guild, quest IDs).
 *
 * USAGE:
 * seedResultContract.parse({ guildSlug: 'siege-guild' });
 * // Returns the parsed record of ContentText
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import { z } from 'zod';

export const seedResultContract = z.record(contentTextContract, contentTextContract);

export type SeedResult = z.infer<typeof seedResultContract>;
