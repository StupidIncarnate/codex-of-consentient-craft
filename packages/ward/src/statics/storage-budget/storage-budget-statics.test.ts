import { storageBudgetStatics } from './storage-budget-statics';

describe('storageBudgetStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(storageBudgetStatics).toStrictEqual({
      limits: {
        runResultsPerFolderBytes: 524288000,
      },
    });
  });
});
