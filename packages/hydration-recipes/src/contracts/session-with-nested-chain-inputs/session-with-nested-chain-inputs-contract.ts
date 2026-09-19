/**
 * PURPOSE: What the `session-with-nested-chain` recipe needs from an earlier step — an existing
 * guild's own `path`, typed as the SAME `GuildPath` brand a guild record actually carries (not
 * `AbsoluteFilePath` — a structurally similar but distinct brand the session ingredient's own
 * `cwd` field uses, which is why the recipe itself re-parses before calling `.under()`). Reach for
 * this over `guildId`, which Part 5's own worked example uses: THIS repo's session ingredient
 * links to its guild via `{ of: 'guild', as: 'cwd', from: 'path' }`, so the value `.under()` needs
 * is the guild's `path`, not its `id` — see `session-with-nested-chain-recipe-broker.ts`'s own
 * header for the full finding.
 *
 * USAGE:
 * sessionWithNestedChainInputsContract.parse({ guildPath: '/tmp/guilds-under-test/guild-1' });
 * // Returns SessionWithNestedChainInputs
 */
import { z } from 'zod';

import { guildPathContract } from '@dungeonmaster/shared/contracts';

export const sessionWithNestedChainInputsContract = z.object({
  guildPath: guildPathContract,
});

export type SessionWithNestedChainInputs = z.infer<typeof sessionWithNestedChainInputsContract>;
