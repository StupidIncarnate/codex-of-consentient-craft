import type { AstNode } from '../../../contracts/ast-node/ast-node-contract';

export const enforceFolderStructureRuleBroker = () => ({
  meta: {
    type: 'problem' as const,
    docs: {
      description: 'Enforce QuestMaestro project folder structure standards',
    },
  },
  create: (context: {
    getFilename: () => string;
    report: (violation: { node: unknown; message: string }) => void;
  }) => {
    const filename = context.getFilename();

    const isInSrcFolder = filename.includes('/src/');
    if (!isInSrcFolder) {
      return {};
    }

    const allowedFolders = [
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
    ];

    const forbiddenFolders = [
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
      'formatters',
      'mappers',
      'converters',
    ];

    return {
      Program: (node: AstNode) => {
        const pathParts = filename.split('/src/')[1]?.split('/') || [];
        const firstFolder = pathParts[0];

        if (!firstFolder) {
          return; // No folder to check
        }

        if (forbiddenFolders.includes(firstFolder)) {
          const suggestion = getFolderSuggestion(firstFolder);
          context.report({
            node,
            message: `Folder "${firstFolder}/" is forbidden. Use "${suggestion}/" instead according to project standards.`,
          });
        } else if (!allowedFolders.includes(firstFolder)) {
          context.report({
            node,
            message: `Unknown folder "${firstFolder}/". Must use one of: ${allowedFolders.join(', ')}`,
          });
        }
      },
    };
  },
});

const getFolderSuggestion = (forbiddenFolder: string): string => {
  const suggestions: Record<string, string> = {
    utils: 'adapters or transformers',
    lib: 'adapters',
    helpers: 'contracts or transformers',
    common: 'distribute by function',
    shared: 'distribute by function',
    core: 'brokers',
    services: 'brokers',
    repositories: 'brokers',
    models: 'contracts',
    types: 'contracts',
    interfaces: 'contracts',
    validators: 'contracts',
    formatters: 'transformers',
    mappers: 'transformers',
    converters: 'transformers',
  };

  return suggestions[forbiddenFolder] || 'contracts';
};
