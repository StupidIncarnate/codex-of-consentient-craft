/**
 * PURPOSE: Bans direct I/O, network mutations, and recipe seeding in test scenario files.
 *
 * USAGE:
 * const rule = ruleBanDirectIoInTestScenariosBroker();
 *
 * WHEN-TO-USE: Registered in @dungeonmaster/local-eslint.
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isBanDirectIoScopeFileGuard } from '../../../guards/is-ban-direct-io-scope-file/is-ban-direct-io-scope-file-guard';
import { banDirectIoInTestScenariosStatics } from '../../../statics/ban-direct-io-in-test-scenarios/ban-direct-io-in-test-scenarios-statics';

export const ruleBanDirectIoInTestScenariosBroker = (): TSESLint.RuleModule<'directIo'> => ({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Bans direct I/O, network mutations, and direct recipe seeding in test scenario files.',
    },
    messages: {
      directIo:
        'Direct I/O, direct network mutations, and direct recipe seeding are banned in test scenario files. All domain state setup and transitions must go through test harnesses (*Harness).',
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context: unknown) => {
    const ctx = context as TSESLint.RuleContext<string, unknown[]>;
    const { filename } = ctx;

    if (!isBanDirectIoScopeFileGuard({ filename })) {
      return {};
    }

    return {
      ImportDeclaration: (node: TSESTree.ImportDeclaration): void => {
        if (typeof node.source.value !== 'string') {
          return;
        }

        const sourceValue = node.source.value;
        if (banDirectIoInTestScenariosStatics.bannedFsModules.some((m) => m === sourceValue)) {
          ctx.report({ node, messageId: 'directIo' });
          return;
        }

        if (sourceValue.startsWith('@dungeonmaster/hydration-recipes/')) {
          ctx.report({ node, messageId: 'directIo' });
          return;
        }

        if (Array.isArray(node.specifiers)) {
          for (const specifier of node.specifiers) {
            if (
              specifier.type === AST_NODE_TYPES.ImportSpecifier &&
              specifier.imported.type === AST_NODE_TYPES.Identifier &&
              banDirectIoInTestScenariosStatics.bannedNamedImports.some(
                (i) =>
                  i ===
                  String(
                    specifier.imported.type === AST_NODE_TYPES.Identifier
                      ? specifier.imported.name
                      : undefined,
                  ),
              )
            ) {
              ctx.report({ node, messageId: 'directIo' });
              return;
            }
          }
        }
      },
      CallExpression: (node: TSESTree.CallExpression): void => {
        if (node.callee.type === AST_NODE_TYPES.Identifier && node.callee.name === 'fetch') {
          ctx.report({ node, messageId: 'directIo' });
          return;
        }

        if (node.callee.type === AST_NODE_TYPES.MemberExpression) {
          const objNode = node.callee.object;
          const propNode = node.callee.property;

          if (
            objNode.type === AST_NODE_TYPES.Identifier &&
            propNode.type === AST_NODE_TYPES.Identifier
          ) {
            const isRequestOrAxios = objNode.name === 'request' || objNode.name === 'axios';
            const propName = propNode.name;
            const isMutationMethod = ['post', 'patch', 'put', 'delete'].some((m) => m === propName);

            if (isRequestOrAxios && isMutationMethod) {
              ctx.report({ node, messageId: 'directIo' });
            }
          }
        }
      },
    };
  },
});
