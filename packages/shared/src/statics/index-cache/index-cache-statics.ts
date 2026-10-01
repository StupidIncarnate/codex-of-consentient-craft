/**
 * PURPOSE: Where and how the repo-wide index caches keep their per-package shards, stated once so the
 * owner index and the contract index share one cache root and one set of rules: the folders under
 * `<rootDir>/node_modules`, the shard and temp-file suffixes, how old a leftover temp file must be
 * before a writer removes it, and where the installed @dungeonmaster/shared sits, whose version
 * every shard is keyed on so an upgrade invalidates them all. Each index names its own folder and
 * schema version in its own statics.
 *
 * USAGE:
 * indexCacheStatics.rootFolderNames;
 * // Returns ['.cache', 'dungeonmaster']
 */

export const indexCacheStatics = {
  rootFolderNames: ['.cache', 'dungeonmaster'],
  shardSuffix: '.json',
  tempSuffix: '.tmp',
  staleTempMs: 3_600_000,
  sharedPackageFolders: ['@dungeonmaster', 'shared'],
} as const;
