/**
 * PURPOSE: One node of the POST-quest package dependency graph — the derived answer to "what depends
 * on what once this quest lands", which `questPackageEntryContract` deliberately does not carry: an
 * entry there is an authored tag, this is computed from the workspace manifests crossed with those
 * tags. Reach for this when ordering work dependencies-first or resolving a package's neighbours;
 * reach for `questPackageEntryContract` when the question is what the quest intends to do.
 *
 * The `id` is the package name rather than a generated key so the array is id-bearing:
 * `questItemDeepMergeTransformer` recurses into arrays of id-bearing objects and upserts per entry,
 * while a plain object value is replaced wholesale.
 *
 * USAGE:
 * packageGraphEntryContract.parse({
 *   id: 'auth-service',
 *   dependsOn: ['shared'],
 *   depth: 1,
 *   packageType: 'library',
 *   changeType: 'edit',
 * });
 * // Returns: PackageGraphEntry object
 */

import { z } from 'zod';

import { packageNameContract } from '../package-name/package-name-contract';
import { packageTypeContract } from '../package-type/package-type-contract';
import { questPackageEntryContract } from '../quest-package-entry/quest-package-entry-contract';

export const packageGraphEntryContract = z.object({
  id: packageNameContract.describe(
    "The package name, which is also this entry's merge key — the graph carries one node per package",
  ),
  dependsOn: z
    .array(packageNameContract)
    .default([])
    .describe(
      'The packages this one imports, unioned across dependencies, devDependencies and peerDependencies. A leaf carries none.',
    ),
  depth: z
    .number()
    .int()
    .nonnegative()
    .brand<'PackageDepth'>()
    .describe(
      'Layer in the topological order, 0 being a leaf that depends on nothing in the workspace. Stored so a dependencies-first ordering is a plain numeric sort rather than a re-walk of the graph.',
    ),
  packageType: packageTypeContract.describe(
    'The kind of package this node is, resolved once so downstream readers never re-run the on-disk detector',
  ),
  changeType: questPackageEntryContract.shape.changeType,
});

export type PackageGraphEntry = z.infer<typeof packageGraphEntryContract>;
