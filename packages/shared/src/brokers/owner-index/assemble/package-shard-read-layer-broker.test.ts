import { createHash } from '#gateway/node/crypto';

import { ContractFileOwnersReadLayerStub } from '../../../contracts/contract-file-owners-read-layer/contract-file-owners-read-layer.stub';
import { OwnerIndexShardStub } from '../../../contracts/owner-index-shard/owner-index-shard.stub';
import { OwnerIndexStandaloneBrandStub } from '../../../contracts/owner-index-standalone-brand/owner-index-standalone-brand.stub';
import { OwnerIndexPackageStub } from '../../../contracts/owner-index-package/owner-index-package.stub';
import { packageShardReadLayerBroker } from './package-shard-read-layer-broker';
import { packageShardReadLayerBrokerProxy } from './package-shard-read-layer-broker.proxy';

const ownerPackage = OwnerIndexPackageStub({ name: '@repo/alpha', dir: '/repo/packages/alpha' });
const { name: packageName } = ownerPackage;
const { sharedVersion } = OwnerIndexShardStub();
const cacheDir = '/repo/node_modules/.cache/dungeonmaster/owner-index';
const shardPath = `${cacheDir}/@repo__alpha.json`;
const aFile = '/repo/packages/alpha/src/contracts/a-id/a-id-contract.ts';
const bFile = '/repo/packages/alpha/src/contracts/b-id/b-id-contract.ts';
const A_TEXT = "export const aIdContract = z.string().brand<'AId'>();";
const B_TEXT = "export const bIdContract = z.string().brand<'BId'>();";
// Same length as B_TEXT: an edit no size or mtime check could be relied on to see.
const B_OLD_TEXT = "export const bIdContract = z.string().brand<'BOd'>();";
const A_HASH = createHash('sha256').update(A_TEXT).digest('hex');
const B_HASH = createHash('sha256').update(B_TEXT).digest('hex');
const B_OLD_HASH = createHash('sha256').update(B_OLD_TEXT).digest('hex');
const aRead = ContractFileOwnersReadLayerStub({
  standaloneBrands: [
    OwnerIndexStandaloneBrandStub({
      contractName: 'aIdContract',
      brandText: 'AId',
      filePath: aFile,
      packageName,
    }),
  ],
});
const bRead = ContractFileOwnersReadLayerStub({
  standaloneBrands: [
    OwnerIndexStandaloneBrandStub({
      contractName: 'bIdContract',
      brandText: 'BId',
      filePath: bFile,
      packageName,
    }),
  ],
});
// A read no source text produces: a test that gets it back proves it came from the shard.
const cachedOnlyRead = ContractFileOwnersReadLayerStub({
  standaloneBrands: [
    OwnerIndexStandaloneBrandStub({
      contractName: 'cachedOnlyContract',
      brandText: 'CachedOnly',
      filePath: aFile,
      packageName,
    }),
  ],
});

describe('packageShardReadLayerBroker', () => {
  describe('no shard on disk', () => {
    it('VALID: {two files, no shard} => parses both and writes a shard holding their hashes and reads', () => {
      const proxy = packageShardReadLayerBrokerProxy();
      proxy.setupSourceText({ filePath: aFile, text: A_TEXT });
      proxy.setupSourceText({ filePath: bFile, text: B_TEXT });

      const result = packageShardReadLayerBroker({
        shardPath,
        ownerPackage,
        filePaths: [aFile, bFile],
        sharedVersion,
      });

      expect({
        result,
        shard: JSON.parse(String(proxy.writtenShard({ shardPath }))),
      }).toStrictEqual({
        result: [
          { filePath: aFile, contentHash: A_HASH, ...aRead },
          { filePath: bFile, contentHash: B_HASH, ...bRead },
        ],
        shard: OwnerIndexShardStub({
          files: [
            { filePath: aFile, contentHash: A_HASH, ...aRead },
            { filePath: bFile, contentHash: B_HASH, ...bRead },
          ],
        }),
      });
    });
  });

  describe('shard on disk', () => {
    it('VALID: {every file hashes to its shard entry} => returns the shard files and writes nothing', () => {
      const proxy = packageShardReadLayerBrokerProxy();
      proxy.setupShard({
        shardPath,
        contents: JSON.stringify(
          OwnerIndexShardStub({
            files: [{ filePath: aFile, contentHash: A_HASH, ...cachedOnlyRead }],
          }),
        ),
      });
      proxy.setupSourceText({ filePath: aFile, text: A_TEXT });

      const result = packageShardReadLayerBroker({
        shardPath,
        ownerPackage,
        filePaths: [aFile],
        sharedVersion,
      });

      expect({ result, shardWrites: proxy.shardWriteCalls({ shardPath }) }).toStrictEqual({
        result: [{ filePath: aFile, contentHash: A_HASH, ...cachedOnlyRead }],
        shardWrites: [],
      });
    });

    it('VALID: {one of two files edited to text of the same length} => re-parses only that file and rewrites the shard', () => {
      const proxy = packageShardReadLayerBrokerProxy();
      proxy.setupShard({
        shardPath,
        contents: JSON.stringify(
          OwnerIndexShardStub({
            files: [
              { filePath: aFile, contentHash: A_HASH, ...cachedOnlyRead },
              { filePath: bFile, contentHash: B_OLD_HASH, ...cachedOnlyRead },
            ],
          }),
        ),
      });
      proxy.setupSourceText({ filePath: aFile, text: A_TEXT });
      proxy.setupSourceText({ filePath: bFile, text: B_TEXT });

      const result = packageShardReadLayerBroker({
        shardPath,
        ownerPackage,
        filePaths: [aFile, bFile],
        sharedVersion,
      });

      expect({
        result,
        shard: JSON.parse(String(proxy.writtenShard({ shardPath }))),
      }).toStrictEqual({
        result: [
          { filePath: aFile, contentHash: A_HASH, ...cachedOnlyRead },
          { filePath: bFile, contentHash: B_HASH, ...bRead },
        ],
        shard: OwnerIndexShardStub({
          files: [
            { filePath: aFile, contentHash: A_HASH, ...cachedOnlyRead },
            { filePath: bFile, contentHash: B_HASH, ...bRead },
          ],
        }),
      });
    });

    it('VALID: {a file added since the shard} => parses only the new file and rewrites the shard', () => {
      const proxy = packageShardReadLayerBrokerProxy();
      proxy.setupShard({
        shardPath,
        contents: JSON.stringify(
          OwnerIndexShardStub({
            files: [{ filePath: aFile, contentHash: A_HASH, ...cachedOnlyRead }],
          }),
        ),
      });
      proxy.setupSourceText({ filePath: aFile, text: A_TEXT });
      proxy.setupSourceText({ filePath: bFile, text: B_TEXT });

      const result = packageShardReadLayerBroker({
        shardPath,
        ownerPackage,
        filePaths: [aFile, bFile],
        sharedVersion,
      });

      expect({
        result,
        shard: JSON.parse(String(proxy.writtenShard({ shardPath }))),
      }).toStrictEqual({
        result: [
          { filePath: aFile, contentHash: A_HASH, ...cachedOnlyRead },
          { filePath: bFile, contentHash: B_HASH, ...bRead },
        ],
        shard: OwnerIndexShardStub({
          files: [
            { filePath: aFile, contentHash: A_HASH, ...cachedOnlyRead },
            { filePath: bFile, contentHash: B_HASH, ...bRead },
          ],
        }),
      });
    });

    it('VALID: {a file deleted since the shard} => rewrites the shard without it', () => {
      const proxy = packageShardReadLayerBrokerProxy();
      proxy.setupShard({
        shardPath,
        contents: JSON.stringify(
          OwnerIndexShardStub({
            files: [
              { filePath: aFile, contentHash: A_HASH, ...cachedOnlyRead },
              { filePath: bFile, contentHash: B_HASH, ...bRead },
            ],
          }),
        ),
      });
      proxy.setupSourceText({ filePath: aFile, text: A_TEXT });

      const result = packageShardReadLayerBroker({
        shardPath,
        ownerPackage,
        filePaths: [aFile],
        sharedVersion,
      });

      expect({
        result,
        shard: JSON.parse(String(proxy.writtenShard({ shardPath }))),
      }).toStrictEqual({
        result: [{ filePath: aFile, contentHash: A_HASH, ...cachedOnlyRead }],
        shard: OwnerIndexShardStub({
          files: [{ filePath: aFile, contentHash: A_HASH, ...cachedOnlyRead }],
        }),
      });
    });

    it('EDGE: {a walked file gone before its read} => leaves it out', () => {
      const proxy = packageShardReadLayerBrokerProxy();
      proxy.setupSourceText({ filePath: aFile, text: A_TEXT });
      proxy.setupMissingSource({ filePath: bFile });

      const result = packageShardReadLayerBroker({
        shardPath,
        ownerPackage,
        filePaths: [aFile, bFile],
        sharedVersion,
      });

      expect(result).toStrictEqual([{ filePath: aFile, contentHash: A_HASH, ...aRead }]);
    });
  });

  describe('a shard that cannot be trusted', () => {
    it('INVALID: {shard is truncated JSON} => treats it as a miss and re-parses', () => {
      const proxy = packageShardReadLayerBrokerProxy();
      proxy.setupShard({ shardPath, contents: '{"schemaVersion":2,"packageName":"@repo/al' });
      proxy.setupSourceText({ filePath: aFile, text: A_TEXT });

      const result = packageShardReadLayerBroker({
        shardPath,
        ownerPackage,
        filePaths: [aFile],
        sharedVersion,
      });

      expect(result).toStrictEqual([{ filePath: aFile, contentHash: A_HASH, ...aRead }]);
    });

    it('INVALID: {shard JSON of the wrong shape} => treats it as a miss and re-parses', () => {
      const proxy = packageShardReadLayerBrokerProxy();
      proxy.setupShard({ shardPath, contents: '{"files":"not a list"}' });
      proxy.setupSourceText({ filePath: aFile, text: A_TEXT });

      const result = packageShardReadLayerBroker({
        shardPath,
        ownerPackage,
        filePaths: [aFile],
        sharedVersion,
      });

      expect(result).toStrictEqual([{ filePath: aFile, contentHash: A_HASH, ...aRead }]);
    });

    it('INVALID: {shard written under another schema version} => treats it as a miss and re-parses', () => {
      const proxy = packageShardReadLayerBrokerProxy();
      proxy.setupShard({
        shardPath,
        contents: JSON.stringify(
          OwnerIndexShardStub({
            schemaVersion: 1,
            files: [{ filePath: aFile, contentHash: A_HASH, ...cachedOnlyRead }],
          }),
        ),
      });
      proxy.setupSourceText({ filePath: aFile, text: A_TEXT });

      const result = packageShardReadLayerBroker({
        shardPath,
        ownerPackage,
        filePaths: [aFile],
        sharedVersion,
      });

      expect(result).toStrictEqual([{ filePath: aFile, contentHash: A_HASH, ...aRead }]);
    });

    it('INVALID: {shard written beside another installed shared version} => treats it as a miss and re-parses', () => {
      const proxy = packageShardReadLayerBrokerProxy();
      proxy.setupShard({
        shardPath,
        contents: JSON.stringify(
          OwnerIndexShardStub({
            sharedVersion: '0.0.9',
            files: [{ filePath: aFile, contentHash: A_HASH, ...cachedOnlyRead }],
          }),
        ),
      });
      proxy.setupSourceText({ filePath: aFile, text: A_TEXT });

      const result = packageShardReadLayerBroker({
        shardPath,
        ownerPackage,
        filePaths: [aFile],
        sharedVersion,
      });

      expect(result).toStrictEqual([{ filePath: aFile, contentHash: A_HASH, ...aRead }]);
    });

    it('INVALID: {shard written for the same package in another folder} => treats it as a miss and re-parses', () => {
      const proxy = packageShardReadLayerBrokerProxy();
      proxy.setupShard({
        shardPath,
        contents: JSON.stringify(
          OwnerIndexShardStub({
            packageDir: '/main-checkout/packages/alpha',
            files: [{ filePath: aFile, contentHash: A_HASH, ...cachedOnlyRead }],
          }),
        ),
      });
      proxy.setupSourceText({ filePath: aFile, text: A_TEXT });

      const result = packageShardReadLayerBroker({
        shardPath,
        ownerPackage,
        filePaths: [aFile],
        sharedVersion,
      });

      expect(result).toStrictEqual([{ filePath: aFile, contentHash: A_HASH, ...aRead }]);
    });
  });

  describe('stale temp files', () => {
    it('VALID: {shard rewritten, a temp file over an hour old beside it} => removes the old temp file', () => {
      const proxy = packageShardReadLayerBrokerProxy();
      proxy.setupSourceText({ filePath: aFile, text: A_TEXT });
      proxy.setupNow({ ms: 1_800_000_000_000 });
      proxy.setupTempFiles({
        cacheDir,
        files: [
          { name: '@repo__alpha.json.4242-0.tmp', modifiedAtMs: 1_700_000_000_000 },
          { name: '@repo__alpha.json.4343-0.tmp', modifiedAtMs: 1_799_999_999_000 },
        ],
      });

      packageShardReadLayerBroker({ shardPath, ownerPackage, filePaths: [aFile], sharedVersion });

      expect({
        old: proxy.unlinkCalls({ path: `${cacheDir}/@repo__alpha.json.4242-0.tmp` }),
        young: proxy.unlinkCalls({ path: `${cacheDir}/@repo__alpha.json.4343-0.tmp` }),
      }).toStrictEqual({ old: [[`${cacheDir}/@repo__alpha.json.4242-0.tmp`]], young: [] });
    });
  });

  describe('a shard that cannot be written', () => {
    it('ERROR: {shard write fails with EROFS} => returns the files and reports the skipped write on stderr', () => {
      const proxy = packageShardReadLayerBrokerProxy();
      proxy.setupSourceText({ filePath: aFile, text: A_TEXT });
      proxy.setupShardWriteFails({ shardPath });

      const result = packageShardReadLayerBroker({
        shardPath,
        ownerPackage,
        filePaths: [aFile],
        sharedVersion,
      });

      expect({ result, stderr: proxy.stderrText() }).toStrictEqual({
        result: [{ filePath: aFile, contentHash: A_HASH, ...aRead }],
        stderr: `[index-cache] cache shard not written: ${shardPath}: Error: EROFS: open '${shardPath}'\n`,
      });
    });
  });

  describe('empty input', () => {
    it('EMPTY: {no files, no shard} => returns no files and writes an empty shard', () => {
      const proxy = packageShardReadLayerBrokerProxy();

      const result = packageShardReadLayerBroker({
        shardPath,
        ownerPackage,
        filePaths: [],
        sharedVersion,
      });

      expect({
        result,
        shard: JSON.parse(String(proxy.writtenShard({ shardPath }))),
      }).toStrictEqual({ result: [], shard: OwnerIndexShardStub({ files: [] }) });
    });
  });
});
