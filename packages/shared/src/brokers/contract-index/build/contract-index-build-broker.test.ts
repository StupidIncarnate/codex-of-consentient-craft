import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
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
      const rootDir = AbsoluteFilePathStub({ value: '/repo-two-packages' });
      const packagesDir = AbsoluteFilePathStub({ value: '/repo-two-packages/packages' });
      const alphaDir = AbsoluteFilePathStub({ value: '/repo-two-packages/packages/alpha' });
      const scopeDir = AbsoluteFilePathStub({ value: '/repo-two-packages/packages/@gateway' });
      const betaDir = AbsoluteFilePathStub({ value: '/repo-two-packages/packages/@gateway/beta' });
      const thingFile = AbsoluteFilePathStub({
        value: '/repo-two-packages/packages/alpha/src/contracts/thing/thing-contract.ts',
      });
      const useFile = AbsoluteFilePathStub({
        value: '/repo-two-packages/packages/alpha/src/brokers/use/use-broker.ts',
      });
      const otherFile = AbsoluteFilePathStub({
        value: '/repo-two-packages/packages/@gateway/beta/src/contracts/other/other-contract.ts',
      });

      proxy.setupSubfolders({ dirPath: packagesDir, folders: ['alpha', '@gateway'] });
      proxy.setupSubfolders({ dirPath: scopeDir, folders: ['beta'] });
      proxy.setupPackageJson({ packageDir: alphaDir, json: '{"name":"@repo/alpha"}' });
      proxy.setupPackageJson({ packageDir: betaDir, json: '{"name":"@repo/beta"}' });
      proxy.setupWalkedFolder({ dirPath: alphaDir, folders: ['src'], files: [] });
      proxy.setupWalkedFolder({
        dirPath: AbsoluteFilePathStub({ value: `${alphaDir}/src` }),
        folders: ['contracts', 'brokers'],
        files: ['index.d.ts'],
      });
      proxy.setupWalkedFolder({
        dirPath: AbsoluteFilePathStub({ value: `${alphaDir}/src/contracts` }),
        folders: ['thing'],
        files: [],
      });
      proxy.setupWalkedFolder({
        dirPath: AbsoluteFilePathStub({ value: `${alphaDir}/src/contracts/thing` }),
        folders: [],
        files: ['thing-contract.ts', 'thing-contract.test.ts'],
      });
      proxy.setupWalkedFolder({
        dirPath: AbsoluteFilePathStub({ value: `${alphaDir}/src/brokers` }),
        folders: ['use'],
        files: [],
      });
      proxy.setupWalkedFolder({
        dirPath: AbsoluteFilePathStub({ value: `${alphaDir}/src/brokers/use` }),
        folders: [],
        files: ['use-broker.ts'],
      });
      proxy.setupWalkedFolder({ dirPath: betaDir, folders: ['src'], files: [] });
      proxy.setupWalkedFolder({
        dirPath: AbsoluteFilePathStub({ value: `${betaDir}/src` }),
        folders: ['contracts'],
        files: [],
      });
      proxy.setupWalkedFolder({
        dirPath: AbsoluteFilePathStub({ value: `${betaDir}/src/contracts` }),
        folders: ['other'],
        files: [],
      });
      proxy.setupWalkedFolder({
        dirPath: AbsoluteFilePathStub({ value: `${betaDir}/src/contracts/other` }),
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
          nestedInFiles: [],
          isParsed: true,
        },
        {
          filePath: otherFile,
          packageName: '@repo/beta',
          isLayer: false,
          exportedContractNames: ['otherContract'],
          typeExports: [{ typeName: 'Other', isSchemaInferred: true, isExempt: false }],
          parseSites: [],
          nestedInFiles: [],
          isParsed: false,
        },
      ]);
    });

    it('VALID: {second call for the same root} => returns the identical cached index', () => {
      const proxy = contractIndexBuildBrokerProxy();
      const rootDir = AbsoluteFilePathStub({ value: '/repo-cached' });
      const packagesDir = AbsoluteFilePathStub({ value: '/repo-cached/packages' });
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
      const rootDir = AbsoluteFilePathStub({ value: '/repo-nameless' });
      const packagesDir = AbsoluteFilePathStub({ value: '/repo-nameless/packages' });
      const namelessDir = AbsoluteFilePathStub({ value: '/repo-nameless/packages/nameless' });
      proxy.setupSubfolders({ dirPath: packagesDir, folders: ['nameless'] });
      proxy.setupPackageJson({ packageDir: namelessDir, json: '{}' });

      const result = contractIndexBuildBroker({ rootDir });

      expect(result).toStrictEqual([]);
    });
  });
});
