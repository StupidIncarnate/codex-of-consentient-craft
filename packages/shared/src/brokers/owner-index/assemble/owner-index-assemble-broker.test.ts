import { createHash } from '#gateway/node/crypto';

import { ContractFileOwnersReadLayerStub } from '../../../contracts/contract-file-owners-read-layer/contract-file-owners-read-layer.stub';
import { OwnerIndexOwnerStub } from '../../../contracts/owner-index-owner/owner-index-owner.stub';
import { OwnerIndexPackageStub } from '../../../contracts/owner-index-package/owner-index-package.stub';
import { OwnerIndexShardStub } from '../../../contracts/owner-index-shard/owner-index-shard.stub';
import { OwnerIndexStandaloneBrandStub } from '../../../contracts/owner-index-standalone-brand/owner-index-standalone-brand.stub';
import { OwnerIndexStub } from '../../../contracts/owner-index/owner-index.stub';
import { ownerIndexAssembleBroker } from './owner-index-assemble-broker';
import { ownerIndexAssembleBrokerProxy } from './owner-index-assemble-broker.proxy';

const THING_TEXT = [
  "import { z } from 'zod';",
  'export const thingContract = z.object({',
  "  id: z.string().brand<'ThingId'>(),",
  '  otherId: otherIdContract,',
  '});',
  'export type Thing = z.infer<typeof thingContract>;',
].join('\n');
const OTHER_ID_TEXT = "export const otherIdContract = z.string().brand<'OtherId'>();";
const LAYER_TEXT =
  "export const thingPartLayerContract = z.object({ id: z.string().brand<'ThingPartId'>() });";

const rootDir = '/repo-assemble';
const alphaDir = `${rootDir}/packages/alpha`;
const betaDir = `${rootDir}/packages/beta`;
const toolsDir = `${rootDir}/packages/tools`;
const thingFile = `${alphaDir}/src/contracts/thing/thing-contract.ts`;
const layerFile = `${alphaDir}/src/contracts/thing/thing-part-layer-contract.ts`;
const otherIdFile = `${betaDir}/src/contracts/other-id/other-id-contract.ts`;
const cacheDir = `${rootDir}/node_modules/.cache/dungeonmaster/owner-index`;

const thingOwnerRead = OwnerIndexOwnerStub({
  ownerName: 'Thing',
  contractName: 'thingContract',
  filePath: thingFile,
  packageName: '@repo/alpha',
  typeName: 'Thing',
  schemaText: "z.object({\n  id: z.string().brand<'ThingId'>(),\n  otherId: otherIdContract,\n})",
  fields: [
    { key: 'id', kind: 'own-brand', brandText: 'ThingId' },
    { key: 'otherId', kind: 'contract-ref', refContractName: 'otherIdContract' },
  ],
});
const otherIdBrand = OwnerIndexStandaloneBrandStub({
  contractName: 'otherIdContract',
  brandText: 'OtherId',
  filePath: otherIdFile,
  packageName: '@repo/beta',
});
const alphaShard = OwnerIndexShardStub({
  packageName: '@repo/alpha',
  packageDir: alphaDir,
  files: [
    {
      filePath: thingFile,
      contentHash: createHash('sha256').update(THING_TEXT).digest('hex'),
      ...ContractFileOwnersReadLayerStub({ owners: [thingOwnerRead] }),
    },
  ],
});
const betaShard = OwnerIndexShardStub({
  packageName: '@repo/beta',
  packageDir: betaDir,
  files: [
    {
      filePath: otherIdFile,
      contentHash: createHash('sha256').update(OTHER_ID_TEXT).digest('hex'),
      ...ContractFileOwnersReadLayerStub({ standaloneBrands: [otherIdBrand] }),
    },
  ],
});
const expectedIndex = OwnerIndexStub({
  owners: [
    OwnerIndexOwnerStub({
      ...thingOwnerRead,
      fields: [
        { key: 'id', kind: 'own-brand', brandText: 'ThingId' },
        {
          key: 'otherId',
          kind: 'brand-ref',
          refContractName: 'otherIdContract',
          brandText: 'OtherId',
        },
      ],
    }),
  ],
  standaloneBrands: [otherIdBrand],
  packages: [
    OwnerIndexPackageStub({ name: '@repo/alpha', dir: alphaDir, dependencies: ['@repo/beta'] }),
    OwnerIndexPackageStub({ name: '@repo/beta', dir: betaDir, dependencies: [] }),
  ],
});

describe('ownerIndexAssembleBroker', () => {
  describe('cold cache', () => {
    it('VALID: {alpha refers to a brand in beta, tools has no contracts} => merges both packages and resolves the cross-package brand-ref', () => {
      const proxy = ownerIndexAssembleBrokerProxy();
      proxy.setupSubfolders({
        dirPath: `${rootDir}/packages`,
        folders: ['alpha', 'beta', 'tools'],
      });
      proxy.setupPackageJson({
        packageDir: alphaDir,
        json: '{"name":"@repo/alpha","dependencies":{"@repo/beta":"*","@repo/tools":"*","zod":"4"}}',
      });
      proxy.setupPackageJson({ packageDir: betaDir, json: '{"name":"@repo/beta"}' });
      proxy.setupPackageJson({ packageDir: toolsDir, json: '{"name":"@repo/tools"}' });
      proxy.setupWalkedFolder({ dirPath: alphaDir, folders: ['src'], files: [] });
      proxy.setupWalkedFolder({ dirPath: `${alphaDir}/src`, folders: ['contracts'], files: [] });
      proxy.setupWalkedFolder({
        dirPath: `${alphaDir}/src/contracts`,
        folders: ['thing'],
        files: [],
      });
      proxy.setupWalkedFolder({
        dirPath: `${alphaDir}/src/contracts/thing`,
        folders: [],
        files: ['thing-contract.ts', 'thing-part-layer-contract.ts'],
      });
      proxy.setupWalkedFolder({ dirPath: betaDir, folders: ['src'], files: [] });
      proxy.setupWalkedFolder({ dirPath: `${betaDir}/src`, folders: ['contracts'], files: [] });
      proxy.setupWalkedFolder({
        dirPath: `${betaDir}/src/contracts`,
        folders: ['other-id'],
        files: [],
      });
      proxy.setupWalkedFolder({
        dirPath: `${betaDir}/src/contracts/other-id`,
        folders: [],
        files: ['other-id-contract.ts'],
      });
      proxy.setupWalkedFolder({ dirPath: toolsDir, folders: [], files: ['index.ts'] });
      proxy.setupSourceText({ filePath: thingFile, text: THING_TEXT });
      proxy.setupSourceText({ filePath: layerFile, text: LAYER_TEXT });
      proxy.setupSourceText({ filePath: otherIdFile, text: OTHER_ID_TEXT });

      const result = ownerIndexAssembleBroker({ rootDir });

      expect({
        result,
        layerReads: proxy.sourceReadCalls({ filePath: layerFile }),
        alphaShard: JSON.parse(
          String(proxy.writtenShard({ shardPath: `${cacheDir}/@repo__alpha.json` })),
        ),
      }).toStrictEqual({ result: expectedIndex, layerReads: [], alphaShard });
    });
  });

  describe('warm cache', () => {
    it('VALID: {both shards match the file text} => returns the same index and rewrites no shard', () => {
      const proxy = ownerIndexAssembleBrokerProxy();
      proxy.setupSubfolders({ dirPath: `${rootDir}/packages`, folders: ['alpha', 'beta'] });
      proxy.setupPackageJson({
        packageDir: alphaDir,
        json: '{"name":"@repo/alpha","dependencies":{"@repo/beta":"*"}}',
      });
      proxy.setupPackageJson({ packageDir: betaDir, json: '{"name":"@repo/beta"}' });
      proxy.setupWalkedFolder({ dirPath: alphaDir, folders: ['src'], files: [] });
      proxy.setupWalkedFolder({ dirPath: `${alphaDir}/src`, folders: ['contracts'], files: [] });
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
      proxy.setupWalkedFolder({ dirPath: betaDir, folders: ['src'], files: [] });
      proxy.setupWalkedFolder({ dirPath: `${betaDir}/src`, folders: ['contracts'], files: [] });
      proxy.setupWalkedFolder({
        dirPath: `${betaDir}/src/contracts`,
        folders: ['other-id'],
        files: [],
      });
      proxy.setupWalkedFolder({
        dirPath: `${betaDir}/src/contracts/other-id`,
        folders: [],
        files: ['other-id-contract.ts'],
      });
      proxy.setupShard({
        shardPath: `${cacheDir}/@repo__alpha.json`,
        contents: JSON.stringify(alphaShard),
      });
      proxy.setupShard({
        shardPath: `${cacheDir}/@repo__beta.json`,
        contents: JSON.stringify(betaShard),
      });
      proxy.setupSourceText({ filePath: thingFile, text: THING_TEXT });
      proxy.setupSourceText({ filePath: otherIdFile, text: OTHER_ID_TEXT });

      const result = ownerIndexAssembleBroker({ rootDir });

      expect({
        result,
        alphaWritten: proxy.writtenShard({ shardPath: `${cacheDir}/@repo__alpha.json` }),
        betaWritten: proxy.writtenShard({ shardPath: `${cacheDir}/@repo__beta.json` }),
      }).toStrictEqual({ result: expectedIndex, alphaWritten: undefined, betaWritten: undefined });
    });

    it('VALID: {installed @dungeonmaster/shared upgraded since the shards} => re-parses and rewrites every shard under the new version', () => {
      const proxy = ownerIndexAssembleBrokerProxy();
      proxy.setupSubfolders({ dirPath: `${rootDir}/packages`, folders: ['alpha', 'beta'] });
      proxy.setupPackageJson({
        packageDir: alphaDir,
        json: '{"name":"@repo/alpha","dependencies":{"@repo/beta":"*"}}',
      });
      proxy.setupPackageJson({ packageDir: betaDir, json: '{"name":"@repo/beta"}' });
      proxy.setupWalkedFolder({ dirPath: alphaDir, folders: ['src'], files: [] });
      proxy.setupWalkedFolder({ dirPath: `${alphaDir}/src`, folders: ['contracts'], files: [] });
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
      proxy.setupWalkedFolder({ dirPath: betaDir, folders: ['src'], files: [] });
      proxy.setupWalkedFolder({ dirPath: `${betaDir}/src`, folders: ['contracts'], files: [] });
      proxy.setupWalkedFolder({
        dirPath: `${betaDir}/src/contracts`,
        folders: ['other-id'],
        files: [],
      });
      proxy.setupWalkedFolder({
        dirPath: `${betaDir}/src/contracts/other-id`,
        folders: [],
        files: ['other-id-contract.ts'],
      });
      proxy.setupShard({
        shardPath: `${cacheDir}/@repo__alpha.json`,
        contents: JSON.stringify(alphaShard),
      });
      proxy.setupShard({
        shardPath: `${cacheDir}/@repo__beta.json`,
        contents: JSON.stringify(betaShard),
      });
      proxy.setupSourceText({ filePath: thingFile, text: THING_TEXT });
      proxy.setupSourceText({ filePath: otherIdFile, text: OTHER_ID_TEXT });

      proxy.setupSharedVersion({ rootDir, version: '0.2.0' });

      const result = ownerIndexAssembleBroker({ rootDir });

      expect({
        result,
        alphaWritten: JSON.parse(
          String(proxy.writtenShard({ shardPath: `${cacheDir}/@repo__alpha.json` })),
        ),
        betaWritten: JSON.parse(
          String(proxy.writtenShard({ shardPath: `${cacheDir}/@repo__beta.json` })),
        ),
      }).toStrictEqual({
        result: expectedIndex,
        alphaWritten: { ...alphaShard, sharedVersion: '0.2.0' },
        betaWritten: { ...betaShard, sharedVersion: '0.2.0' },
      });
    });
  });

  describe('empty input', () => {
    it('EMPTY: {no packages} => returns an empty index', () => {
      const proxy = ownerIndexAssembleBrokerProxy();
      proxy.setupSubfolders({ dirPath: '/repo-none/packages', folders: [] });

      const result = ownerIndexAssembleBroker({ rootDir: '/repo-none' });

      expect(result).toStrictEqual(OwnerIndexStub());
    });
  });
});
