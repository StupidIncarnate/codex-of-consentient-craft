/**
 * PURPOSE: Maps forbidden generic folder names to their proper alternatives
 *
 * USAGE:
 * import { forbiddenFolderStatics } from './statics/forbidden-folder/forbidden-folder-statics';
 * const alternative = forbiddenFolderStatics.mappings['utils'];
 * // Returns 'adapters or transformers'
 * const isFolder Forbidden = forbiddenFolderStatics.folders.includes('helpers');
 * // Returns true
 *
 * WHEN-TO-USE: When validating project structure to enforce semantic folder naming
 */
export const forbiddenFolderStatics = {
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
} as const;
