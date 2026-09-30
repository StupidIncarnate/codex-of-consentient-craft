/**
 * PURPOSE: Defines the data `globDiscoverFilesBroker` returns
 *
 * USAGE:
 * globDiscoverFilesResultContract.parse(value);
 * // Returns validated GlobDiscoverFilesResult
 */
import { z } from '#gateway/npm/zod';
import { projectResultContract } from '../project-result/project-result-contract';

export const globDiscoverFilesResultContract = z
  .object({
    discoveredCount: projectResultContract.shape.discoveredCount,
    discoveredFiles: z.array(z.string().brand<'GlobDiscoverFilesResultDiscoveredFiles'>()),
  })
  .brand<'GlobDiscoverFilesResult'>();

export type GlobDiscoverFilesResult = z.infer<typeof globDiscoverFilesResultContract>;
