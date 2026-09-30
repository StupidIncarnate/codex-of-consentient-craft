/**
 * PURPOSE: Defines the validated body shape for directory-browse responder
 *
 * USAGE:
 * const { path } = directoryBrowseBodyContract.parse(body);
 * // Returns: { path?: GuildPath }
 */

import { z } from '#gateway/npm/zod';

export const directoryBrowseBodyContract = z.object({
  path: z.string().min(1).brand<'DirectoryBrowseBodyPath'>().optional(),
});

export type DirectoryBrowseBody = z.infer<typeof directoryBrowseBodyContract>;
