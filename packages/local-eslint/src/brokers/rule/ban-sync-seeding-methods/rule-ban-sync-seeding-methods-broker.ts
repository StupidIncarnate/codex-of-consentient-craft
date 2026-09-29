/**
 * PURPOSE: Enforces that all seeding methods in harness files are asynchronous,
 * returning a Promise.
 *
 * USAGE:
 * const rule = ruleBanSyncSeedingMethodsBroker();
 *
 * WHEN-TO-USE: Registered in @dungeonmaster/local-eslint.
 */
import { eslintRuleContract } from '@dungeonmaster/eslint-plugin';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import type { EslintRule } from '@dungeonmaster/eslint-plugin';
import { isBanSyncSeedingMethodsScopeFileGuard } from '../../../guards/is-ban-sync-seeding-methods-scope-file/is-ban-sync-seeding-methods-scope-file-guard';
import { banSyncSeedingMethodsStatics } from '../../../statics/ban-sync-seeding-methods/ban-sync-seeding-methods-statics';

export const ruleBanSyncSeedingMethodsBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description: 'Enforces that harness seeding methods must be async and return a Promise.',
      },
      messages: {
        syncSeeding:
          "Harness seeding method '{{methodName}}' must be async and return a Promise. All seeding operations must be asynchronous.",
      },
      schema: [],
    },
  }),
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    const { filename } = ctx;

    if (!isBanSyncSeedingMethodsScopeFileGuard({ filename })) {
      return {};
    }

    return {
      Property: (node: TSESTree.Property): void => {
        if (node.key.type !== AST_NODE_TYPES.Identifier) {
          return;
        }

        const methodName = node.key.name;

        const valueNode = node.value;
        if (
          valueNode.type !== AST_NODE_TYPES.FunctionExpression &&
          valueNode.type !== AST_NODE_TYPES.ArrowFunctionExpression
        ) {
          return;
        }

        const isSeedingMethod = banSyncSeedingMethodsStatics.seedingPrefixes.some((prefix) =>
          methodName.startsWith(prefix),
        );
        if (!isSeedingMethod) {
          return;
        }

        const typeAnnotation = valueNode.returnType?.typeAnnotation;
        const returnsPromise =
          typeAnnotation?.type === AST_NODE_TYPES.TSTypeReference &&
          typeAnnotation.typeName.type === AST_NODE_TYPES.Identifier &&
          typeAnnotation.typeName.name === 'Promise';

        if (!valueNode.async && !returnsPromise) {
          ctx.report({
            node,
            messageId: 'syncSeeding',
            data: {
              methodName,
            },
          });
        }
      },
      MethodDefinition: (node: TSESTree.MethodDefinition): void => {
        if (node.key.type !== AST_NODE_TYPES.Identifier) {
          return;
        }

        const methodName = node.key.name;

        const valueNode = node.value;
        if (valueNode.type !== AST_NODE_TYPES.FunctionExpression) {
          return;
        }

        const isSeedingMethod = banSyncSeedingMethodsStatics.seedingPrefixes.some((prefix) =>
          methodName.startsWith(prefix),
        );
        if (!isSeedingMethod) {
          return;
        }

        const typeAnnotation = valueNode.returnType?.typeAnnotation;
        const returnsPromise =
          typeAnnotation?.type === AST_NODE_TYPES.TSTypeReference &&
          typeAnnotation.typeName.type === AST_NODE_TYPES.Identifier &&
          typeAnnotation.typeName.name === 'Promise';

        if (!valueNode.async && !returnsPromise) {
          ctx.report({
            node,
            messageId: 'syncSeeding',
            data: {
              methodName,
            },
          });
        }
      },
    };
  },
});
