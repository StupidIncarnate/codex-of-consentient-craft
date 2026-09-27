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
import { folderTypeContract } from '../folder-type/folder-type-contract';
import { importPathContract } from '../import-path/import-path-contract';

export const folderDependencyTreeContract = z.object({
  hierarchy: contentTextContract,
  // `z.partialRecord`, not `z.record` — zod v4 made an enum-keyed `z.record` exhaustive (every
  // enum member required), and a dependency graph legitimately omits a folder type with no edges.
  graph: z.partialRecord(folderTypeContract, z.array(importPathContract).readonly()),
  matrix: contentTextContract,
});

export type FolderDependencyTree = z.infer<typeof folderDependencyTreeContract>;
