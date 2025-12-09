/**
 * PURPOSE: Defines the structure for folder dependency visualization output
 *
 * USAGE:
 * const tree = folderDependencyTreeContract.parse({
 *   hierarchy: ContentTextStub({ value: 'statics/...' }),
 *   graph: { statics: [] },
 *   matrix: ContentTextStub({ value: 'FROM...' })
 * });
 * // Returns validated FolderDependencyTree object
 */

import { z } from 'zod';
import { contentTextContract } from '../content-text/content-text-contract';
import { folderTypeContract } from '@dungeonmaster/shared/contracts';
import { importPathContract } from '../import-path/import-path-contract';

export const folderDependencyTreeContract = z.object({
  hierarchy: contentTextContract,
  graph: z.record(folderTypeContract, z.array(importPathContract).readonly()),
  matrix: contentTextContract,
});

export type FolderDependencyTree = z.infer<typeof folderDependencyTreeContract>;
