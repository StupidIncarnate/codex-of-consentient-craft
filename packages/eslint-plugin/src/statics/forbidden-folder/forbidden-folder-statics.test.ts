import { forbiddenFolderStatics } from './forbidden-folder-statics';

describe('forbiddenFolderStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(forbiddenFolderStatics).toStrictEqual({
      mappings: {
        utils: 'adapters or transformers',
        lib: 'adapters',
        helpers: 'guards or transformers',
        common: 'distribute by function',
        shared: 'distribute by function',
        core: 'brokers',
        services: 'brokers',
        repositories: 'brokers',
        models: 'contracts',
        types: 'contracts',
        interfaces: 'contracts',
        validators: 'contracts',
        constants: 'statics',
        config: 'statics',
        enums: 'statics',
        formatters: 'transformers',
        mappers: 'transformers',
        converters: 'transformers',
      },
      folders: [
        'utils',
        'lib',
        'helpers',
        'common',
        'shared',
        'core',
        'services',
        'repositories',
        'models',
        'types',
        'interfaces',
        'validators',
        'constants',
        'config',
        'enums',
        'formatters',
        'mappers',
        'converters',
      ],
    });
  });
});
