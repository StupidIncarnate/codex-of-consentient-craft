const forbiddenFolderMappings = {
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
};

export const forbiddenFolders = Object.keys(forbiddenFolderMappings);

export const forbiddenFolderSuggestionTransformer = ({
  forbiddenFolder,
}: {
  forbiddenFolder: string;
}): string => {
  const isValidKey = (key: string): key is keyof typeof forbiddenFolderMappings =>
    key in forbiddenFolderMappings;

  if (isValidKey(forbiddenFolder)) {
    return forbiddenFolderMappings[forbiddenFolder];
  }
  return 'contracts';
};
