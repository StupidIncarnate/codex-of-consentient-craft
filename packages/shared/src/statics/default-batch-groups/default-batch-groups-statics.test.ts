import { defaultBatchGroupsStatics } from './default-batch-groups-statics';

describe('defaultBatchGroupsStatics', () => {
  it('VALID: value => matches curated two-group shape', () => {
    expect(defaultBatchGroupsStatics).toStrictEqual({
      value: [
        [
          'contracts',
          'statics',
          'errors',
          'guards',
          'transformers',
          'state',
          'middleware',
          'adapters',
        ],
        ['responders', 'flows'],
      ],
    });
  });

  it('VALID: value => no folder type appears in more than one group', () => {
    const allFolderTypes = defaultBatchGroupsStatics.value.flat();
    const uniqueFolderTypes = new Set(allFolderTypes);

    expect(uniqueFolderTypes.size).toBe(allFolderTypes.length);
  });
});
