import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ownerIndexBuildBroker } from './owner-index-build-broker';
import { ownerIndexBuildBrokerProxy } from './owner-index-build-broker.proxy';

const THING_TEXT = [
  "import { z } from 'zod';",
  'export const thingContract = z.object({',
  "  id: z.string().brand<'ThingId'>(),",
  '  otherId: otherContract.shape.id,',
  '});',
  'export type Thing = z.infer<typeof thingContract>;',
  '',
].join('\n');

const OTHER_TEXT = [
  "import { z } from 'zod';",
  "export const otherContract = z.object({ id: z.string().brand<'OtherId'>() });",
  'export type Other = z.infer<typeof otherContract>;',
  '',
].join('\n');

describe('ownerIndexBuildBroker', () => {
  describe('valid input', () => {
    it('VALID: {alpha depends on beta} => indexes both owners with their keys and the direct dependency', () => {
      const proxy = ownerIndexBuildBrokerProxy();
      const rootDir = AbsoluteFilePathStub({ value: '/repo-owners' });
      const alphaDir = AbsoluteFilePathStub({ value: '/repo-owners/packages/alpha' });
      const betaDir = AbsoluteFilePathStub({ value: '/repo-owners/packages/beta' });
      const thingFile = AbsoluteFilePathStub({
        value: `${alphaDir}/src/contracts/thing/thing-contract.ts`,
      });
      const otherFile = AbsoluteFilePathStub({
        value: `${betaDir}/src/contracts/other/other-contract.ts`,
      });

      proxy.setupSubfolders({
        dirPath: AbsoluteFilePathStub({ value: '/repo-owners/packages' }),
        folders: ['alpha', 'beta'],
      });
      proxy.setupPackageJson({
        packageDir: alphaDir,
        json: '{"name":"@repo/alpha","dependencies":{"@repo/beta":"*","zod":"1"}}',
      });
      proxy.setupPackageJson({ packageDir: betaDir, json: '{"name":"@repo/beta"}' });
      proxy.setupWalkedFolder({ dirPath: alphaDir, folders: ['src'], files: [] });
      proxy.setupWalkedFolder({
        dirPath: AbsoluteFilePathStub({ value: `${alphaDir}/src` }),
        folders: ['contracts'],
        files: [],
      });
      proxy.setupWalkedFolder({
        dirPath: AbsoluteFilePathStub({ value: `${alphaDir}/src/contracts` }),
        folders: ['thing'],
        files: [],
      });
      proxy.setupWalkedFolder({
        dirPath: AbsoluteFilePathStub({ value: `${alphaDir}/src/contracts/thing` }),
        folders: [],
        files: ['thing-contract.ts'],
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
      proxy.setupSourceText({ filePath: thingFile, text: THING_TEXT });
      proxy.setupSourceText({ filePath: otherFile, text: OTHER_TEXT });

      const result = ownerIndexBuildBroker({ rootDir });

      expect({
        owners: result.owners.map(({ ownerName, packageName, typeName, fields }) => ({
          ownerName,
          packageName,
          typeName,
          fields,
        })),
        packages: result.packages,
      }).toStrictEqual({
        owners: [
          {
            ownerName: 'Thing',
            packageName: '@repo/alpha',
            typeName: 'Thing',
            fields: [
              { key: 'id', kind: 'own-brand', brandText: 'ThingId' },
              {
                key: 'otherId',
                kind: 'owner-reuse',
                refContractName: 'otherContract',
                refKey: 'id',
              },
            ],
          },
          {
            ownerName: 'Other',
            packageName: '@repo/beta',
            typeName: 'Other',
            fields: [{ key: 'id', kind: 'own-brand', brandText: 'OtherId' }],
          },
        ],
        packages: [
          { name: '@repo/alpha', dir: alphaDir, dependencies: ['@repo/beta'] },
          { name: '@repo/beta', dir: betaDir, dependencies: [] },
        ],
      });
    });

    it('VALID: {second call for the same root} => returns the identical cached index', () => {
      const proxy = ownerIndexBuildBrokerProxy();
      const rootDir = AbsoluteFilePathStub({ value: '/repo-owners-cached' });
      proxy.setupSubfolders({
        dirPath: AbsoluteFilePathStub({ value: '/repo-owners-cached/packages' }),
        folders: [],
      });

      const first = ownerIndexBuildBroker({ rootDir });
      const second = ownerIndexBuildBroker({ rootDir });

      expect(second).toBe(first);
      expect(first).toStrictEqual({ owners: [], standaloneBrands: [], packages: [] });
    });
  });
});
