/**
 * PURPOSE: Contract for a file path with its source (project or shared package)
 *
 * USAGE:
 * const file = fileWithSourceContract.parse({ filepath: '/path/to/file.ts', source: 'project', basePath: '/base' });
 * // Returns validated FileWithSource
 */
import { z } from 'zod';
import { pathSegmentContract } from '@dungeonmaster/shared/contracts';

export const fileWithSourceContract = z.object({
  filepath: pathSegmentContract,
  source: z.enum(['project', 'shared']).brand<'FileSource'>(),
  basePath: pathSegmentContract,
});

export type FileWithSource = z.infer<typeof fileWithSourceContract>;
