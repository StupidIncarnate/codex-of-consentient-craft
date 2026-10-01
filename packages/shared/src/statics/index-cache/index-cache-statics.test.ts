import { indexCacheStatics } from './index-cache-statics';

describe('indexCacheStatics', () => {
  it('VALID: {indexCacheStatics} => holds the cache root, suffixes, temp-file age and shared package folders', () => {
    expect(indexCacheStatics).toStrictEqual({
      rootFolderNames: ['.cache', 'dungeonmaster'],
      shardSuffix: '.json',
      tempSuffix: '.tmp',
      staleTempMs: 3_600_000,
      sharedPackageFolders: ['@dungeonmaster', 'shared'],
    });
  });
});
