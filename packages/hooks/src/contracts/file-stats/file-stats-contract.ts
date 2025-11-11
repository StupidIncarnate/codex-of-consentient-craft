/**
 * PURPOSE: Zod schema for Node.js fs.Stats with minimal required properties
 *
 * USAGE:
 * const stats = fileStatsContract.parse({ isFile: () => true, size: 1024 });
 * // Returns validated FileStats object
 */
import { z } from 'zod';

export const fileStatsContract = z.object({
  isFile: z.function().optional(),
  isDirectory: z.function().optional(),
  size: z.number().int().nonnegative().brand<'FileSize'>().optional(),
});

export type FileStats = z.infer<typeof fileStatsContract> & {
  isFile?: () => boolean;
  isDirectory?: () => boolean;
};
