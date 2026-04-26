/**
 * PURPOSE: Defines the validated body shape for directory-browse responder
 *
 * USAGE:
 * const { path } = directoryBrowseBodyContract.parse(body);
 * // Returns: { path?: GuildPath }
 */

import { z } from 'zod';
import { guildPathContract } from '@dungeonmaster/shared/contracts';

export const directoryBrowseBodyContract = z.object({
  path: guildPathContract.optional(),
});

export type DirectoryBrowseBody = z.infer<typeof directoryBrowseBodyContract>;
