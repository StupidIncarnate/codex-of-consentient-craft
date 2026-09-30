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

import { z } from '#gateway/npm/zod';
import { folderTypeContract } from '../folder-type/folder-type-contract';

export const folderDependencyTreeContract = z.object({
  hierarchy: z.string().brand<'FolderDependencyTreeHierarchy'>(),
  // `z.partialRecord`, not `z.record` — zod v4 made an enum-keyed `z.record` exhaustive (every
  // enum member required), and a dependency graph legitimately omits a folder type with no edges.
  graph: z.partialRecord(folderTypeContract, z.array(z.string().brand<'FolderDependencyTreeGraph'>()).readonly()),
  matrix: z.string().brand<'FolderDependencyTreeMatrix'>(),
}).brand<'FolderDependencyTree'>();

export type FolderDependencyTree = z.infer<typeof folderDependencyTreeContract>;
