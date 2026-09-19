/**
 * PURPOSE: What `GET /api/guilds` answers with — the app's own `Guild` shape, in a list. Reach for
 * this over parsing a recipe's own narrower shape: a recipe reading the app's response through the
 * app's OWN contract means a guild field changing shape breaks the recipe's test in the same ward
 * run as the change, which is the whole reason a recipe is a workspace package rather than a
 * fixture folder (siegelense-tooling.md line 2025).
 *
 * The route answers a BARE array and this contract wraps it under `guilds`, so the shape has a
 * name a stub and an error path can both address — an array contract has no field to report a
 * failure against.
 *
 * USAGE:
 * guildListingContract.parse({ guilds: await fetchJsonAdapter({ url, method: 'GET' }) });
 * // Returns { guilds: [...] } — every guild the lane knows about
 */

import { guildContract } from '@dungeonmaster/shared/contracts';
import { z } from 'zod';

export const guildListingContract = z
  .object({
    guilds: z.array(guildContract),
  })
  .strict();

export type GuildListing = z.infer<typeof guildListingContract>;
