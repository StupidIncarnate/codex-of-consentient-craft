import { contractIndexBuildBroker } from './contract-index-build-broker';
import { contractIndexBuildBrokerProxy } from './contract-index-build-broker.proxy';

const CONTRACT_TEXT = [
  "import { z } from 'zod';",
  "export const thingContract = z.string().brand<'Thing'>();",
  'export type Thing = z.infer<typeof thingContract>;',
  '',
].join('\n');

const BROKER_TEXT = [
  "import { thingContract } from '../../contracts/thing/thing-contract';",
  'export const useBroker = ({ value }: { value: unknown }) => thingContract.parse(value);',
  '',
].join('\n');

const OTHER_CONTRACT_TEXT = [
  "import { z } from 'zod';",
  "export const otherContract = z.string().brand<'Other'>();",
  'export type Other = z.infer<typeof otherContract>;',
  '',
].join('\n');

describe('contractIndexBuildBroker', () => {
  describe('valid input', () => {
    it('VALID: {a plain and a scoped package} => indexes both contracts, marking the parsed one', () => {
      const proxy = contractIndexBuildBrokerProxy();
      const rootDir = '/repo-two-packages';
      const packagesDir = '/repo-two-packages/packages';
      const alphaDir = '/repo-two-packages/packages/alpha';
      const scopeDir = '/repo-two-packages/packages/@gateway';
      const betaDir = '/repo-two-packages/packages/@gateway/beta';
      const thingFile = '/repo-two-packages/packages/alpha/src/contracts/thing/thing-contract.ts';
      const useFile = '/repo-two-packages/packages/alpha/src/brokers/use/use-broker.ts';
      const otherFile =
        '/repo-two-packages/packages/@gateway/beta/src/contracts/other/other-contract.ts';

      proxy.setupSubfolders({ dirPath: packagesDir, folders: ['alpha', '@gateway'] });
      proxy.setupSubfolders({ dirPath: scopeDir, folders: ['beta'] });
      proxy.setupPackageJson({ packageDir: alphaDir, json: '{"name":"@repo/alpha"}' });
      proxy.setupPackageJson({ packageDir: betaDir, json: '{"name":"@repo/beta"}' });
      proxy.setupWalkedFolder({ dirPath: alphaDir, folders: ['src'], files: [] });
      proxy.setupWalkedFolder({
        dirPath: `${alphaDir}/src`,
        folders: ['contracts', 'brokers'],
        files: ['index.d.ts'],
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
      proxy.setupWalkedFolder({
        dirPath: `${alphaDir}/src/brokers`,
        folders: ['use'],
        files: [],
      });
      proxy.setupWalkedFolder({
        dirPath: `${alphaDir}/src/brokers/use`,
        folders: [],
        files: ['use-broker.ts'],
      });
      proxy.setupWalkedFolder({ dirPath: betaDir, folders: ['src'], files: [] });
      proxy.setupWalkedFolder({
        dirPath: `${betaDir}/src`,
        folders: ['contracts'],
        files: [],
      });
      proxy.setupWalkedFolder({
        dirPath: `${betaDir}/src/contracts`,
        folders: ['other'],
        files: [],
      });
      proxy.setupWalkedFolder({
        dirPath: `${betaDir}/src/contracts/other`,
        folders: [],
        files: ['other-contract.ts'],
      });
      proxy.setupSourceText({ filePath: thingFile, text: CONTRACT_TEXT });
      proxy.setupSourceText({ filePath: useFile, text: BROKER_TEXT });
      proxy.setupSourceText({ filePath: otherFile, text: OTHER_CONTRACT_TEXT });

      const result = contractIndexBuildBroker({ rootDir });

      expect(result).toStrictEqual([
        {
          filePath: thingFile,
          packageName: '@repo/alpha',
          isLayer: false,
          exportedContractNames: ['thingContract'],
          typeExports: [{ typeName: 'Thing', isSchemaInferred: true, isExempt: false }],
          parseSites: [{ filePath: useFile, line: 2 }],
          wholeParseSites: [{ filePath: useFile, line: 2 }],
          nestedInFiles: [],
          isParsed: true,
          isWholeParsed: true,
        },
        {
          filePath: otherFile,
          packageName: '@repo/beta',
          isLayer: false,
          exportedContractNames: ['otherContract'],
          typeExports: [{ typeName: 'Other', isSchemaInferred: true, isExempt: false }],
          parseSites: [],
          wholeParseSites: [],
          nestedInFiles: [],
          isParsed: false,
          isWholeParsed: false,
        },
      ]);
    });

    it('VALID: {second call for the same root} => returns the identical cached index', () => {
      const proxy = contractIndexBuildBrokerProxy();
      const rootDir = '/repo-cached';
      const packagesDir = '/repo-cached/packages';
      proxy.setupSubfolders({ dirPath: packagesDir, folders: [] });

      const first = contractIndexBuildBroker({ rootDir });
      const second = contractIndexBuildBroker({ rootDir });

      expect(second).toBe(first);
      expect(first).toStrictEqual([]);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {package.json without a name} => skips that package', () => {
      const proxy = contractIndexBuildBrokerProxy();
      const rootDir = '/repo-nameless';
      const packagesDir = '/repo-nameless/packages';
      const namelessDir = '/repo-nameless/packages/nameless';
      proxy.setupSubfolders({ dirPath: packagesDir, folders: ['nameless'] });
      proxy.setupPackageJson({ packageDir: namelessDir, json: '{}' });

      const result = contractIndexBuildBroker({ rootDir });

      expect(result).toStrictEqual([]);
    });
  });
});
