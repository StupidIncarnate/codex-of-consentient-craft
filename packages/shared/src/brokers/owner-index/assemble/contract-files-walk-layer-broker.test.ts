import { contractFilesWalkLayerBroker } from './contract-files-walk-layer-broker';
import { contractFilesWalkLayerBrokerProxy } from './contract-files-walk-layer-broker.proxy';

describe('contractFilesWalkLayerBroker', () => {
  describe('valid input', () => {
    it('VALID: {contracts in nested folders} => lists a folder own files first, then its subfolders last-listed first', () => {
      const proxy = contractFilesWalkLayerBrokerProxy();
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

      const result = contractFilesWalkLayerBroker({ rootDir: '/repo', dirPath: pkg });

      expect(result).toStrictEqual([
        `${pkg}/src/contracts/b/b-contract.ts`,
        `${pkg}/src/contracts/b/b-owner-layer-contract.ts`,
        `${pkg}/src/contracts/a/a-contract.ts`,
      ]);
    });

    it('VALID: {node_modules, dist and test folders} => never lists them', () => {
      const proxy = contractFilesWalkLayerBrokerProxy();
      const pkg = '/repo-skip/packages/alpha';
      proxy.setupWalkedFolder({
        dirPath: pkg,
        folders: ['node_modules', 'dist', 'test', 'src'],
        files: [],
      });
      proxy.setupWalkedFolder({ dirPath: `${pkg}/src`, folders: [], files: [] });

      const result = contractFilesWalkLayerBroker({ rootDir: '/repo-skip', dirPath: pkg });

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
      const proxy = contractFilesWalkLayerBrokerProxy();
      proxy.setupMissingFolder({ dirPath: '/repo-gone/packages/alpha' });

      const result = contractFilesWalkLayerBroker({
        rootDir: '/repo-gone',
        dirPath: '/repo-gone/packages/alpha',
      });

      expect(result).toStrictEqual([]);
    });
  });
});
