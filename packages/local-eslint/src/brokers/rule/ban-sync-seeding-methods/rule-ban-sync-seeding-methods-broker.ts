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
import type { EslintRule, EslintContext, Tsestree } from '@dungeonmaster/eslint-plugin';
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
  create: (context: unknown) => {
    const ctx = context as EslintContext;
    const filename = ctx.filename ?? ctx.getFilename?.() ?? '';

    if (!isBanSyncSeedingMethodsScopeFileGuard({ filename: String(filename) })) {
      return {};
    }

    return {
      Property: (node: Tsestree): void => {
        if (!node.key || node.key.type !== 'Identifier' || typeof node.key.name !== 'string') {
          return;
        }

        const methodName = String(node.key.name);
        if (!node.value) {
          return;
        }

        const valueNode = node.value as Record<PropertyKey, unknown>;
        if (
          valueNode.type !== 'FunctionExpression' &&
          valueNode.type !== 'ArrowFunctionExpression'
        ) {
          return;
        }

        const isSeedingMethod = banSyncSeedingMethodsStatics.seedingPrefixes.some((prefix) =>
          methodName.startsWith(prefix),
        );
        if (!isSeedingMethod) {
          return;
        }

        const isAsync = valueNode.async === true;
        let returnsPromise = false;

        const returnType = valueNode.returnType as Record<PropertyKey, unknown> | undefined;
        const typeAnnotation = returnType?.typeAnnotation as
          | Record<PropertyKey, unknown>
          | undefined;
        const typeName = typeAnnotation?.typeName as Record<PropertyKey, unknown> | undefined;

        if (
          typeAnnotation?.type === 'TSTypeReference' &&
          typeName?.type === 'Identifier' &&
          typeName.name === 'Promise'
        ) {
          returnsPromise = true;
        }

        if (!isAsync && !returnsPromise) {
          ctx.report({
            node,
            messageId: 'syncSeeding',
            data: {
              methodName,
            },
          });
        }
      },
      MethodDefinition: (node: Tsestree): void => {
        if (!node.key || node.key.type !== 'Identifier' || typeof node.key.name !== 'string') {
          return;
        }

        const methodName = String(node.key.name);
        if (!node.value) {
          return;
        }

        const valueNode = node.value as Record<PropertyKey, unknown>;
        if (valueNode.type !== 'FunctionExpression') {
          return;
        }

        const isSeedingMethod = banSyncSeedingMethodsStatics.seedingPrefixes.some((prefix) =>
          methodName.startsWith(prefix),
        );
        if (!isSeedingMethod) {
          return;
        }

        const isAsync = valueNode.async === true;
        let returnsPromise = false;

        const returnType = valueNode.returnType as Record<PropertyKey, unknown> | undefined;
        const typeAnnotation = returnType?.typeAnnotation as
          | Record<PropertyKey, unknown>
          | undefined;
        const typeName = typeAnnotation?.typeName as Record<PropertyKey, unknown> | undefined;

        if (
          typeAnnotation?.type === 'TSTypeReference' &&
          typeName?.type === 'Identifier' &&
          typeName.name === 'Promise'
        ) {
          returnsPromise = true;
        }

        if (!isAsync && !returnsPromise) {
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
