import { indexCacheShardWriteBroker } from './index-cache-shard-write-broker';
import { indexCacheShardWriteBrokerProxy } from './index-cache-shard-write-broker.proxy';

const cacheDir = '/repo/node_modules/.cache/dungeonmaster/owner-index';
const shardPath = `${cacheDir}/@repo__alpha.json`;

describe('indexCacheShardWriteBroker', () => {
  describe('valid input', () => {
    it('VALID: {shard} => writes it as JSON and removes only a temp file over an hour old', () => {
      const proxy = indexCacheShardWriteBrokerProxy();
      proxy.setupNow({ ms: 1_800_000_000_000 });
      proxy.setupTempFiles({
        cacheDir,
        files: [
          { name: '@repo__alpha.json.4242-0.tmp', modifiedAtMs: 1_700_000_000_000 },
          { name: '@repo__alpha.json.4343-0.tmp', modifiedAtMs: 1_799_999_999_000 },
        ],
      });

      indexCacheShardWriteBroker({ shardPath, shard: { schemaVersion: 1, files: [] } });

      expect({
        written: proxy.writtenShard({ shardPath }),
        old: proxy.unlinkCalls({ path: `${cacheDir}/@repo__alpha.json.4242-0.tmp` }),
        young: proxy.unlinkCalls({ path: `${cacheDir}/@repo__alpha.json.4343-0.tmp` }),
      }).toStrictEqual({
        written: '{"schemaVersion":1,"files":[]}',
        old: [[`${cacheDir}/@repo__alpha.json.4242-0.tmp`]],
        young: [],
      });
    });
  });

  describe('a shard that cannot be written', () => {
    it('ERROR: {write fails with EROFS} => reports one stderr line and returns', () => {
      const proxy = indexCacheShardWriteBrokerProxy();
      proxy.setupShardWriteFails({ shardPath });

      indexCacheShardWriteBroker({ shardPath, shard: {} });

      expect(proxy.stderrText()).toBe(
        `[index-cache] cache shard not written: ${shardPath}: Error: EROFS: open '${shardPath}'\n`,
      );
    });
  });
});
