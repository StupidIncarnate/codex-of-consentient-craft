/**
 * PURPOSE: Contract for a file path with its source (project or shared package)
 *
 * USAGE:
 * const file = fileWithSourceContract.parse({ filepath: '/path/to/file.ts', source: 'project', basePath: '/base' });
 * // Returns validated FileWithSource
 */
import { z } from 'zod';
import { filePathContract } from '../file-path/file-path-contract';
import { absoluteFilePathContract } from '../absolute-file-path/absolute-file-path-contract';

export const fileWithSourceContract = z.object({
  filepath: filePathContract,
  source: z.enum(['project', 'shared']).brand<'FileSource'>(),
  basePath: absoluteFilePathContract,
});

export type FileWithSource = z.infer<typeof fileWithSourceContract>;
