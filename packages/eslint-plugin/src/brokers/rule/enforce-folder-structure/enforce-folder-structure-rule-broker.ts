import type { Rule } from 'eslint';
import type { TSESTree } from '@typescript-eslint/utils';

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

export const enforceFolderStructureRuleBroker = (): Rule.RuleModule => ({
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce QuestMaestro project folder structure standards',
    },
    messages: {
      forbiddenFolder:
        'Folder "{{folder}}/" is forbidden. Use "{{suggestion}}/" instead according to project standards.',
      unknownFolder: 'Unknown folder "{{folder}}/". Must use one of: {{allowed}}',
    },
    schema: [],
  },
  create: (context: Rule.RuleContext) => {
    const filename = context.filename;

    const isInSrcFolder = filename.includes('/src/');
    if (!isInSrcFolder) {
      return {};
    }

    return {
      Program: (node: TSESTree.Node) => {
        const pathParts = filename.split('/src/')[1]?.split('/') || [];
        const firstFolder = pathParts[0];

        if (!firstFolder) {
          return; // No folder to check
        }

        if (forbiddenFolders.includes(firstFolder)) {
          const suggestion = getFolderSuggestion(firstFolder);
          context.report({
            node,
            messageId: 'forbiddenFolder',
            data: {
              folder: firstFolder,
              suggestion,
            },
          });
        } else if (!allowedFolders.includes(firstFolder)) {
          context.report({
            node,
            messageId: 'unknownFolder',
            data: {
              folder: firstFolder,
              allowed: allowedFolders.join(', '),
            },
          });
        }
      },
    } as Rule.RuleListener;
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
