import { ownerIndexStatics } from './owner-index-statics';

describe('ownerIndexStatics', () => {
  it('VALID: {ownerIndexStatics} => holds the object roots, layer suffix, skipped folders and cache location', () => {
    expect(ownerIndexStatics).toStrictEqual({
      objectRootNames: ['object', 'strictObject', 'looseObject'],
      layerContractSuffix: '-layer-contract.ts',
      walk: {
        skipFolderNames: [
          'node_modules',
          'dist',
          'test',
          'tests',
          'e2e',
          '__mocks__',
          'test-fixtures',
        ],
      },
      cache: {
        folderNames: ['.cache', 'dungeonmaster', 'owner-index'],
        shardSuffix: '.json',
        tempSuffix: '.tmp',
        staleTempMs: 3_600_000,
        schemaVersion: 2,
        sharedPackageFolders: ['@dungeonmaster', 'shared'],
      },
    });
  });
});
