import { indexCacheShardPathTransformer } from './index-cache-shard-path-transformer';

describe('indexCacheShardPathTransformer', () => {
  it('VALID: {scoped package} => joins the cache root, the index folder and the package name with / as __', () => {
    expect(
      indexCacheShardPathTransformer({
        rootDir: '/repo',
        folderName: 'owner-index',
        packageName: '@repo/alpha',
      }),
    ).toBe('/repo/node_modules/.cache/dungeonmaster/owner-index/@repo__alpha.json');
  });

  it('VALID: {unscoped package} => keeps the name as it is', () => {
    expect(
      indexCacheShardPathTransformer({
        rootDir: '/repo',
        folderName: 'contract-index',
        packageName: 'tools',
      }),
    ).toBe('/repo/node_modules/.cache/dungeonmaster/contract-index/tools.json');
  });
});
