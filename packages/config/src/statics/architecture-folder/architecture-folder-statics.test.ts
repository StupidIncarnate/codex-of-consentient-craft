import { architectureFolderStatics } from './architecture-folder-statics';

describe('architectureFolderStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(architectureFolderStatics).toStrictEqual({
      folders: {
        all: [
          'contracts',
          'transformers',
          'errors',
          'flows',
          'adapters',
          'middleware',
          'brokers',
          'bindings',
          'state',
          'responders',
          'widgets',
          'startup',
          'assets',
          'migrations',
        ],
      },
    });
  });
});
