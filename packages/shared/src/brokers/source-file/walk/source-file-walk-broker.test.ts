import { isContractSourceFileGuard } from '../../../guards/is-contract-source-file/is-contract-source-file-guard';
import { ownerIndexStatics } from '../../../statics/owner-index/owner-index-statics';
import { sourceFileWalkBroker } from './source-file-walk-broker';
import { sourceFileWalkBrokerProxy } from './source-file-walk-broker.proxy';

describe('sourceFileWalkBroker', () => {
  describe('valid input', () => {
    it('VALID: {contracts in nested folders} => lists a folder own files first, then its subfolders last-listed first', () => {
      const proxy = sourceFileWalkBrokerProxy();
      const pkg = '/repo/packages/alpha';
      proxy.setupWalkedFolder({ dirPath: pkg, folders: ['src'], files: ['package.json'] });
      proxy.setupWalkedFolder({ dirPath: `${pkg}/src`, folders: ['contracts'], files: [] });
      proxy.setupWalkedFolder({
        dirPath: `${pkg}/src/contracts`,
        folders: ['a', 'b'],
        files: [],
      });
      proxy.setupWalkedFolder({
        dirPath: `${pkg}/src/contracts/a`,
        folders: [],
        files: ['a-contract.ts', 'a-contract.test.ts', 'a.stub.ts'],
      });
      proxy.setupWalkedFolder({
        dirPath: `${pkg}/src/contracts/b`,
        folders: [],
        files: ['b-contract.ts', 'b-owner-layer-contract.ts'],
      });

      const result = sourceFileWalkBroker({
        rootDir: '/repo',
        dirPath: pkg,
        skipFolderNames: ownerIndexStatics.walk.skipFolderNames,
        isWantedFile: isContractSourceFileGuard,
      });

      expect(result).toStrictEqual([
        `${pkg}/src/contracts/b/b-contract.ts`,
        `${pkg}/src/contracts/b/b-owner-layer-contract.ts`,
        `${pkg}/src/contracts/a/a-contract.ts`,
      ]);
    });

    it('VALID: {node_modules, dist and test folders} => never lists them', () => {
      const proxy = sourceFileWalkBrokerProxy();
      const pkg = '/repo-skip/packages/alpha';
      proxy.setupWalkedFolder({
        dirPath: pkg,
        folders: ['node_modules', 'dist', 'test', 'src'],
        files: [],
      });
      proxy.setupWalkedFolder({ dirPath: `${pkg}/src`, folders: [], files: [] });

      const result = sourceFileWalkBroker({
        rootDir: '/repo-skip',
        dirPath: pkg,
        skipFolderNames: ownerIndexStatics.walk.skipFolderNames,
        isWantedFile: isContractSourceFileGuard,
      });

      expect({
        result,
        nodeModulesListed: proxy.getReaddirCallsFor({ dirPath: `${pkg}/node_modules` }),
        distListed: proxy.getReaddirCallsFor({ dirPath: `${pkg}/dist` }),
        testListed: proxy.getReaddirCallsFor({ dirPath: `${pkg}/test` }),
      }).toStrictEqual({ result: [], nodeModulesListed: [], distListed: [], testListed: [] });
    });
  });

  describe('things that vanish mid-walk', () => {
    it('EMPTY: {folder missing} => returns an empty list', () => {
      const proxy = sourceFileWalkBrokerProxy();
      proxy.setupMissingFolder({ dirPath: '/repo-gone/packages/alpha' });

      const result = sourceFileWalkBroker({
        rootDir: '/repo-gone',
        dirPath: '/repo-gone/packages/alpha',
        skipFolderNames: ownerIndexStatics.walk.skipFolderNames,
        isWantedFile: isContractSourceFileGuard,
      });

      expect(result).toStrictEqual([]);
    });
  });
});
