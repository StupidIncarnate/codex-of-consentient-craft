import { ContractIndexEntryStub } from '../../../contracts/contract-index-entry/contract-index-entry.stub';
import { ContractIndexFileReadStub } from '../../../contracts/contract-index-file-read/contract-index-file-read.stub';
import { ContractIndexShardStub } from '../../../contracts/contract-index-shard/contract-index-shard.stub';
import { contentHashTransformer } from '../../../transformers/content-hash/content-hash-transformer';
import { contractIndexAssembleBroker } from './contract-index-assemble-broker';
import { contractIndexAssembleBrokerProxy } from './contract-index-assemble-broker.proxy';

const rootDir = '/repo-ci-assemble';
const alphaDir = `${rootDir}/packages/alpha`;
const thingFile = `${alphaDir}/src/contracts/thing/thing-contract.ts`;
const useFile = `${alphaDir}/src/brokers/use/use-broker.ts`;
const widgetFile = `${alphaDir}/src/widgets/w/w-widget.tsx`;
const shardPath = `${rootDir}/node_modules/.cache/dungeonmaster/contract-index/@repo__alpha.json`;
const THING_TEXT = "export const thingContract = z.string().brand<'Thing'>();";
const USE_TEXT =
  "import { thingContract } from '../../contracts/thing/thing-contract';\nexport const useBroker = (v: unknown) => thingContract.parse(v);";
const WIDGET_TEXT = 'export const WWidget = () => null;';

const expectedEntry = ContractIndexEntryStub({
  filePath: thingFile,
  packageName: '@repo/alpha',
  isLayer: false,
  exportedContractNames: ['thingContract'],
  typeExports: [],
  parseSites: [{ filePath: useFile, line: 2 }],
  wholeParseSites: [{ filePath: useFile, line: 2 }],
  nestedInFiles: [],
  isParsed: true,
  isWholeParsed: true,
});

describe('contractIndexAssembleBroker', () => {
  describe('cold cache', () => {
    it('VALID: {a broker parses a contract, a widget mentions none} => indexes the contract as parsed and caches both parsed files', () => {
      const proxy = contractIndexAssembleBrokerProxy();
      proxy.setupSubfolders({ dirPath: `${rootDir}/packages`, folders: ['alpha'] });
      proxy.setupPackageJson({ packageDir: alphaDir, json: '{"name":"@repo/alpha"}' });
      proxy.setupWalkedFolder({ dirPath: alphaDir, folders: ['src'], files: ['README.md'] });
      proxy.setupWalkedFolder({
        dirPath: `${alphaDir}/src`,
        folders: ['contracts', 'brokers', 'widgets'],
        files: [],
      });
      proxy.setupWalkedFolder({
        dirPath: `${alphaDir}/src/contracts`,
        folders: ['thing'],
        files: [],
      });
      proxy.setupWalkedFolder({
        dirPath: `${alphaDir}/src/contracts/thing`,
        folders: [],
        files: ['thing-contract.ts', 'thing-contract.test.ts'],
      });
      proxy.setupWalkedFolder({ dirPath: `${alphaDir}/src/brokers`, folders: ['use'], files: [] });
      proxy.setupWalkedFolder({
        dirPath: `${alphaDir}/src/brokers/use`,
        folders: [],
        files: ['use-broker.ts'],
      });
      proxy.setupWalkedFolder({ dirPath: `${alphaDir}/src/widgets`, folders: ['w'], files: [] });
      proxy.setupWalkedFolder({
        dirPath: `${alphaDir}/src/widgets/w`,
        folders: [],
        files: ['w-widget.tsx'],
      });
      proxy.setupSourceText({ filePath: thingFile, text: THING_TEXT });
      proxy.setupSourceText({ filePath: useFile, text: USE_TEXT });
      proxy.setupSourceText({ filePath: widgetFile, text: WIDGET_TEXT });

      const result = contractIndexAssembleBroker({ rootDir });

      expect({
        result,
        cachedFiles: (
          JSON.parse(String(proxy.writtenShard({ shardPath }))) as ReturnType<
            typeof ContractIndexShardStub
          >
        ).files.map(({ filePath }) => filePath),
      }).toStrictEqual({ result: [expectedEntry], cachedFiles: [useFile, thingFile] });
    });
  });

  describe('warm cache', () => {
    it('VALID: {the shard matches both files} => gives the same index from the shard reads', () => {
      const proxy = contractIndexAssembleBrokerProxy();
      proxy.setupSubfolders({ dirPath: `${rootDir}/packages`, folders: ['alpha'] });
      proxy.setupPackageJson({ packageDir: alphaDir, json: '{"name":"@repo/alpha"}' });
      proxy.setupWalkedFolder({ dirPath: alphaDir, folders: ['src'], files: [] });
      proxy.setupWalkedFolder({
        dirPath: `${alphaDir}/src`,
        folders: ['contracts', 'brokers'],
        files: [],
      });
      proxy.setupWalkedFolder({
        dirPath: `${alphaDir}/src/contracts`,
        folders: ['thing'],
        files: [],
      });
      proxy.setupWalkedFolder({
        dirPath: `${alphaDir}/src/contracts/thing`,
        folders: [],
        files: ['thing-contract.ts'],
      });
      proxy.setupWalkedFolder({ dirPath: `${alphaDir}/src/brokers`, folders: ['use'], files: [] });
      proxy.setupWalkedFolder({
        dirPath: `${alphaDir}/src/brokers/use`,
        folders: [],
        files: ['use-broker.ts'],
      });
      proxy.setupSourceText({ filePath: thingFile, text: THING_TEXT });
      proxy.setupSourceText({ filePath: useFile, text: USE_TEXT });
      proxy.setupShard({
        shardPath,
        contents: JSON.stringify(
          ContractIndexShardStub({
            packageDir: alphaDir,
            files: [
              {
                filePath: useFile,
                contentHash: contentHashTransformer({ text: USE_TEXT }),
                read: ContractIndexFileReadStub({
                  imports: [
                    {
                      localName: 'thingContract',
                      importedName: 'thingContract',
                      specifier: '../../contracts/thing/thing-contract',
                      isTypeOnly: false,
                    },
                  ],
                  parseCalls: [
                    { line: 2, parsedNames: ['thingContract'], wholeNames: ['thingContract'] },
                  ],
                  valueNames: ['thingContract'],
                }),
              },
              {
                filePath: thingFile,
                contentHash: contentHashTransformer({ text: THING_TEXT }),
                read: ContractIndexFileReadStub({
                  exports: { exportedContractNames: ['thingContract'], typeExports: [] },
                }),
              },
            ],
          }),
        ),
      });

      const result = contractIndexAssembleBroker({ rootDir });

      expect({ result, written: proxy.writtenShard({ shardPath }) }).toStrictEqual({
        result: [expectedEntry],
        written: undefined,
      });
    });
  });
});
