/**
 * PURPOSE: The owner index's fixed vocabulary, stated once so the broker, the chain reader and any
 * test that stages a repo agree: the zod call names that open an object contract, the suffix that
 * marks a layer contract, the folders whose files can never be production contracts (so a walk
 * skips them whole), and where the per-package cache shards live: under which schema version, beside
 * which installed @dungeonmaster/shared, and how old a leftover temp file must be before a writer
 * removes it. Bump `cache.schemaVersion` whenever a change alters what a per-file read holds, so
 * every shard written before it reads as a miss; an upgrade of the installed shared package does the
 * same on its own.
 *
 * USAGE:
 * ownerIndexStatics.objectRootNames;
 * // Returns ['object', 'strictObject', 'looseObject']
 */
import { locationsStatics } from '../locations/locations-statics';

export const ownerIndexStatics = {
  objectRootNames: ['object', 'strictObject', 'looseObject'],
  layerContractSuffix: '-layer-contract.ts',
  walk: {
    skipFolderNames: [
      locationsStatics.repoRoot.nodeModules,
      locationsStatics.repoRoot.dist,
      'test',
      'tests',
      'e2e',
      '__mocks__',
      'test-fixtures',
    ],
  },
  cache: {
    folderNames: ['.cache', 'dungeonmaster', 'owner-index'],
    shardSuffix: '.json',
    tempSuffix: '.tmp',
    staleTempMs: 3_600_000,
    schemaVersion: 2,
    sharedPackageFolders: ['@dungeonmaster', 'shared'],
  },
} as const;
