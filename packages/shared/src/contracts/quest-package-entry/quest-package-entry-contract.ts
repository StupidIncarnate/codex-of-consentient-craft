/**
 * PURPOSE: One package a quest declares it will touch, carrying the two orthogonal axes a bare name
 * cannot: what the quest DOES to the package (`changeType`) and what KIND of package it is
 * (`packageType` for display, `packageTypes` for every kind its signals support). Reach for this
 * over a bare `packageNameContract` wherever a downstream decision needs the package's kind — e2e
 * eligibility, prompt routing — or its post-quest existence, which is what the dependency graph is
 * built from. A bare `packageNameContract` stays the right type for a pointer that only has to name
 * a package the reader can already look up on disk.
 *
 * USAGE:
 * questPackageEntryContract.parse({
 *   name: 'auth-service',
 *   location: './packages/auth-service',
 *   changeType: 'edit',
 *   packageType: 'library',
 * });
 * // Returns: QuestPackageEntry object
 */

import { z } from 'zod';

import { filePathContract } from '../file-path/file-path-contract';
import { packageNameContract } from '../package-name/package-name-contract';
import { packageTypeContract } from '../package-type/package-type-contract';

export const questPackageEntryContract = z.object({
  name: packageNameContract.describe(
    'The package directory name under the workspace root, which is how every node tag and operation item refers to it',
  ),
  location: filePathContract.describe(
    "The package root, either absolute or prefixed './' relative to the quest's own project root. Carried rather than derived because a 'new' package has no path to look up yet, and because a quest may run in a repo whose layout is not packages/<name>.",
  ),
  changeType: z
    .enum(['new', 'edit', 'delete'])
    .describe(
      "What the quest does to this package: 'new' creates it, 'edit' changes one already on disk, 'delete' removes it. Drives the disk-existence check at write time and whether the post-quest dependency graph gains or loses this node.",
    ),
  packageType: packageTypeContract.describe(
    "The kind of package, stamped from the on-disk detector for 'edit' and 'delete'. A 'new' package has nothing on disk to detect, so its author declares it. This is the DISPLAY label — one kind, the detector's winner — and never the input to an eligibility decision.",
  ),
  packageTypes: z
    .array(packageTypeContract)
    .default([])
    .describe(
      "Every kind this package's own disk signals support, winner first, stamped alongside packageType. A package can honestly be more than one — widgets+react behind a hono adapter is both an http-backend and browser-reachable — and the detector's priority table returns on its first match, so any decision made from the single winning label silently drops the kinds it never reached. Empty means never stamped, and readers fall back to [packageType].",
    ),
  usedBy: z
    .array(packageNameContract)
    .optional()
    .describe(
      "Packages that will depend on this one. Required and non-empty when changeType is 'new': a package with no package.json on disk yet has no other source of reverse edges for the post-quest dependency graph.",
    ),
});

export type QuestPackageEntry = z.infer<typeof questPackageEntryContract>;
