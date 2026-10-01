import { ContractIndexFileReadStub } from '../../../contracts/contract-index-file-read/contract-index-file-read.stub';
import { ContractIndexPackageStub } from '../../../contracts/contract-index-package/contract-index-package.stub';
import { ContractIndexShardStub } from '../../../contracts/contract-index-shard/contract-index-shard.stub';
import { contentHashTransformer } from '../../../transformers/content-hash/content-hash-transformer';
import { contractShardReadLayerBroker } from './contract-shard-read-layer-broker';
import { contractShardReadLayerBrokerProxy } from './contract-shard-read-layer-broker.proxy';

const rootDir = '/repo';
const workspacePackage = ContractIndexPackageStub({
  name: '@repo/alpha',
  dir: '/repo/packages/alpha',
});
const { sharedVersion } = ContractIndexShardStub();
const shardPath = '/repo/node_modules/.cache/dungeonmaster/contract-index/@repo__alpha.json';
const brokerFile = '/repo/packages/alpha/src/brokers/use/use-broker.ts';
const plainFile = '/repo/packages/alpha/src/statics/x/x-statics.ts';
const BROKER_TEXT =
  "import { aContract } from '../../contracts/a/a-contract';\naContract.parse(v);";
// Same length as BROKER_TEXT: an edit no size or mtime check could be relied on to see.
const BROKER_OLD_TEXT =
  "import { bContract } from '../../contracts/a/a-contract';\nbContract.parse(v);";
const PLAIN_TEXT = 'export const xStatics = { a: 1 } as const;';
const brokerRead = ContractIndexFileReadStub({
  imports: [
    {
      localName: 'aContract',
      importedName: 'aContract',
      specifier: '../../contracts/a/a-contract',
      isTypeOnly: false,
    },
  ],
  parseCalls: [{ line: 2, parsedNames: ['aContract'], wholeNames: ['aContract'] }],
  valueNames: ['aContract'],
});
// A read no source text produces: a test that gets it back proves it came from the shard.
const cachedOnlyRead = ContractIndexFileReadStub({ valueNames: ['cachedOnlyContract'] });

describe('contractShardReadLayerBroker', () => {
  describe('no shard on disk', () => {
    it('VALID: {a file mentioning a contract and one that does not} => parses only the first and writes a shard of it', () => {
      const proxy = contractShardReadLayerBrokerProxy();
      proxy.setupSourceText({ filePath: brokerFile, text: BROKER_TEXT });
      proxy.setupSourceText({ filePath: plainFile, text: PLAIN_TEXT });

      const result = contractShardReadLayerBroker({
        rootDir,
        shardPath,
        workspacePackage,
        filePaths: [brokerFile, plainFile],
        sharedVersion,
      });

      expect({
        result,
        shard: JSON.parse(String(proxy.writtenShard({ shardPath }))),
      }).toStrictEqual({
        result: [
          { filePath: brokerFile, read: brokerRead },
          { filePath: plainFile, read: null },
        ],
        shard: ContractIndexShardStub({
          files: [
            {
              filePath: brokerFile,
              contentHash: contentHashTransformer({ text: BROKER_TEXT }),
              read: brokerRead,
            },
          ],
        }),
      });
    });
  });

  describe('shard on disk', () => {
    it('VALID: {the file hashes to its shard entry} => returns the shard read and writes nothing', () => {
      const proxy = contractShardReadLayerBrokerProxy();
      proxy.setupSourceText({ filePath: brokerFile, text: BROKER_TEXT });
      proxy.setupShard({
        shardPath,
        contents: JSON.stringify(
          ContractIndexShardStub({
            files: [
              {
                filePath: brokerFile,
                contentHash: contentHashTransformer({ text: BROKER_TEXT }),
                read: cachedOnlyRead,
              },
            ],
          }),
        ),
      });

      const result = contractShardReadLayerBroker({
        rootDir,
        shardPath,
        workspacePackage,
        filePaths: [brokerFile],
        sharedVersion,
      });

      expect({ result, writes: proxy.shardWriteCalls({ shardPath }) }).toStrictEqual({
        result: [{ filePath: brokerFile, read: cachedOnlyRead }],
        writes: [],
      });
    });

    it('VALID: {the file edited to text of the same length} => re-parses it', () => {
      const proxy = contractShardReadLayerBrokerProxy();
      proxy.setupSourceText({ filePath: brokerFile, text: BROKER_TEXT });
      proxy.setupShard({
        shardPath,
        contents: JSON.stringify(
          ContractIndexShardStub({
            files: [
              {
                filePath: brokerFile,
                contentHash: contentHashTransformer({ text: BROKER_OLD_TEXT }),
                read: cachedOnlyRead,
              },
            ],
          }),
        ),
      });

      const result = contractShardReadLayerBroker({
        rootDir,
        shardPath,
        workspacePackage,
        filePaths: [brokerFile],
        sharedVersion,
      });

      expect(result).toStrictEqual([{ filePath: brokerFile, read: brokerRead }]);
    });

    it('VALID: {a shard file no longer walked} => rewrites the shard without it', () => {
      const proxy = contractShardReadLayerBrokerProxy();
      proxy.setupShard({
        shardPath,
        contents: JSON.stringify(
          ContractIndexShardStub({
            files: [
              {
                filePath: brokerFile,
                contentHash: contentHashTransformer({ text: BROKER_TEXT }),
                read: cachedOnlyRead,
              },
            ],
          }),
        ),
      });

      const result = contractShardReadLayerBroker({
        rootDir,
        shardPath,
        workspacePackage,
        filePaths: [],
        sharedVersion,
      });

      expect({
        result,
        shard: JSON.parse(String(proxy.writtenShard({ shardPath }))),
      }).toStrictEqual({ result: [], shard: ContractIndexShardStub({ files: [] }) });
    });

    it('EDGE: {a walked file gone before its read} => leaves it out', () => {
      const proxy = contractShardReadLayerBrokerProxy();
      proxy.setupMissingSource({ filePath: brokerFile });

      const result = contractShardReadLayerBroker({
        rootDir,
        shardPath,
        workspacePackage,
        filePaths: [brokerFile],
        sharedVersion,
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('a shard that cannot be trusted', () => {
    it.each([
      ['another schema version', { schemaVersion: 0 }],
      ['another installed shared version', { sharedVersion: '0.0.9' }],
      ['the same package in another folder', { packageDir: '/main-checkout/packages/alpha' }],
    ] as const)('INVALID: {shard written under %s} => re-parses', (_label, override) => {
      const proxy = contractShardReadLayerBrokerProxy();
      proxy.setupSourceText({ filePath: brokerFile, text: BROKER_TEXT });
      proxy.setupShard({
        shardPath,
        contents: JSON.stringify(
          ContractIndexShardStub({
            ...override,
            files: [
              {
                filePath: brokerFile,
                contentHash: contentHashTransformer({ text: BROKER_TEXT }),
                read: cachedOnlyRead,
              },
            ],
          }),
        ),
      });

      const result = contractShardReadLayerBroker({
        rootDir,
        shardPath,
        workspacePackage,
        filePaths: [brokerFile],
        sharedVersion,
      });

      expect(result).toStrictEqual([{ filePath: brokerFile, read: brokerRead }]);
    });

    it('INVALID: {shard is truncated JSON} => re-parses', () => {
      const proxy = contractShardReadLayerBrokerProxy();
      proxy.setupSourceText({ filePath: brokerFile, text: BROKER_TEXT });
      proxy.setupShard({ shardPath, contents: '{"schemaVersion":1,"files":[{"fil' });

      const result = contractShardReadLayerBroker({
        rootDir,
        shardPath,
        workspacePackage,
        filePaths: [brokerFile],
        sharedVersion,
      });

      expect(result).toStrictEqual([{ filePath: brokerFile, read: brokerRead }]);
    });
  });
});
