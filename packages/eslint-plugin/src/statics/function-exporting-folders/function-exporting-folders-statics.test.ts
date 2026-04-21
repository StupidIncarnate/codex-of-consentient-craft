import { functionExportingFoldersStatics } from './function-exporting-folders-statics';

describe('functionExportingFoldersStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(functionExportingFoldersStatics).toStrictEqual({
      names: [
        'adapters',
        'bindings',
        'brokers',
        'flows',
        'guards',
        'middleware',
        'responders',
        'state',
        'transformers',
        'widgets',
      ],
      startupPathSegment: '/startup/',
      startupFolderType: 'startup',
    });
  });
});
