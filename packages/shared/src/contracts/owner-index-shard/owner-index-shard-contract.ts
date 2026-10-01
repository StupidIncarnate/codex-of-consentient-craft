/**
 * PURPOSE: One package's slice of the owner index cache on disk: the schema version and the installed
 * @dungeonmaster/shared version it was written under, the package it belongs to, and every non-layer
 * contract file of that package with the sha256 of the text it had when read, beside what reading it
 * gave: its owners, standalone brands and enums. Reach for this over OwnerIndex when the question
 * is which files of one package can skip a re-parse; the owner index is the merge of these.
 *
 * USAGE:
 * ownerIndexShardContract.parse({ schemaVersion: 2, sharedVersion: '0.1.0', packageName: '@repo/a', packageDir: '/repo/packages/a', files: [] });
 * // Returns: OwnerIndexShard validated object
 */

import { z } from '#gateway/npm/zod';

import { ownerIndexEnumContract } from '../owner-index-enum/owner-index-enum-contract';
import { ownerIndexOwnerContract } from '../owner-index-owner/owner-index-owner-contract';
import { ownerIndexPackageContract } from '../owner-index-package/owner-index-package-contract';
import { ownerIndexStandaloneBrandContract } from '../owner-index-standalone-brand/owner-index-standalone-brand-contract';

export const ownerIndexShardContract = z
  .object({
    schemaVersion: z.number().int().brand<'OwnerIndexShardSchemaVersion'>(),
    sharedVersion: z.string().brand<'OwnerIndexShardSharedVersion'>(),
    packageName: ownerIndexPackageContract.shape.name,
    packageDir: ownerIndexPackageContract.shape.dir,
    files: z.array(
      z
        .object({
          filePath: z.string().min(1).brand<'OwnerIndexShardFilesFilePath'>(),
          contentHash: z
            .string()
            .regex(/^[0-9a-f]{64}$/u)
            .brand<'OwnerIndexShardFilesContentHash'>(),
          owners: z.array(ownerIndexOwnerContract),
          standaloneBrands: z.array(ownerIndexStandaloneBrandContract),
          enums: z.array(ownerIndexEnumContract),
        })
        .brand<'OwnerIndexShardFiles'>(),
    ),
  })
  .brand<'OwnerIndexShard'>();

export type OwnerIndexShard = z.infer<typeof ownerIndexShardContract>;
