/**
 * PURPOSE: One package's slice of the contract index cache on disk: the schema version and the
 * installed @dungeonmaster/shared version it was written under, the package it belongs to, and every
 * file of that package the contract index parses, with the sha256 of the text it had when read and
 * what reading it gave. Reach for this over ContractIndexEntry when the question is which files of
 * one package can skip a re-parse; the contract index is what resolving all of these across files
 * gives.
 *
 * USAGE:
 * contractIndexShardContract.parse({ schemaVersion: 1, sharedVersion: '0.1.0', packageName: '@repo/a', packageDir: '/repo/packages/a', files: [] });
 * // Returns: ContractIndexShard validated object
 */

import { z } from '#gateway/npm/zod';

import { contractIndexFileReadContract } from '../contract-index-file-read/contract-index-file-read-contract';
import { contractIndexPackageContract } from '../contract-index-package/contract-index-package-contract';

export const contractIndexShardContract = z
  .object({
    schemaVersion: z.number().int().brand<'ContractIndexShardSchemaVersion'>(),
    sharedVersion: z.string().brand<'ContractIndexShardSharedVersion'>(),
    packageName: contractIndexPackageContract.shape.name,
    packageDir: contractIndexPackageContract.shape.dir,
    files: z.array(
      z
        .object({
          filePath: z.string().min(1).brand<'ContractIndexShardFilesFilePath'>(),
          contentHash: z
            .string()
            .regex(/^[0-9a-f]{64}$/u)
            .brand<'ContractIndexShardFilesContentHash'>(),
          read: contractIndexFileReadContract,
        })
        .brand<'ContractIndexShardFiles'>(),
    ),
  })
  .brand<'ContractIndexShard'>();

export type ContractIndexShard = z.infer<typeof contractIndexShardContract>;
