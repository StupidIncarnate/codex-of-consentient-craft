/**
 * PURPOSE: Zod schema for Node.js fs.Stats with minimal required properties
 *
 * USAGE:
 * const stats = fileStatsContract.parse({ isFile: () => true, size: 1024 });
 * // Returns validated FileStats object
 */
import { z } from '#gateway/npm/zod';

// `isFile` and `isDirectory` are functions — a Zod object schema cannot check callability, so
// both stay out of the parse and are attached only through the type intersection below.
export const fileStatsContract = z.object({
  size: z.number().int().nonnegative().brand<'FileSize'>().optional(),
});

export type FileStats = z.infer<typeof fileStatsContract> & {
  isFile?: () => boolean;
  isDirectory?: () => boolean;
};
