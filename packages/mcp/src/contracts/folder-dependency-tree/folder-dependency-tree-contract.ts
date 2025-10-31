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
import { folderTypeContract } from '@questmaestro/shared/contracts';

const importPathContract = z.string().brand<'ImportPath'>();
export type ImportPath = z.infer<typeof importPathContract>;

export const folderDependencyTreeContract = z.object({
  hierarchy: contentTextContract,
  graph: z.record(folderTypeContract, z.array(importPathContract).readonly()),
  matrix: contentTextContract,
});

export type FolderDependencyTree = z.infer<typeof folderDependencyTreeContract>;
