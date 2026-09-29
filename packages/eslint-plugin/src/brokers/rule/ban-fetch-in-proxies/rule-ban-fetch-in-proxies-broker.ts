/**
 * PURPOSE: Bans direct fetch usage and fetch mocking in proxy files to enforce using StartEndpointMock from @dungeonmaster/testing
 *
 * USAGE:
 * const rule = ruleBanFetchInProxiesBroker();
 * // Returns ESLint rule that prevents globalThis.fetch, fetch(), and jest.spyOn(globalThis, 'fetch') in proxy files
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';

export const ruleBanFetchInProxiesBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ban direct fetch usage and fetch mocking in proxy files. Use StartEndpointMock from @dungeonmaster/testing instead.',
      },
      messages: {
        noFetchInProxy:
          'Use StartEndpointMock from @dungeonmaster/testing to mock HTTP endpoints. Direct fetch mocking in proxy files is not allowed.',
      },
      schema: [],
    },
  }),
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    const { filename } = ctx;

    const isProxyFile = hasFileSuffixGuard({ filename, suffix: 'proxy' });

    if (!isProxyFile) {
      return {};
    }

    return {
      MemberExpression: (node: TSESTree.MemberExpression): void => {
        // Check for globalThis.fetch
        const { object, property } = node;

        if (
          object.type === AST_NODE_TYPES.Identifier &&
          object.name === 'globalThis' &&
          property.type === AST_NODE_TYPES.Identifier &&
          property.name === 'fetch'
        ) {
          // Skip if this is part of jest.spyOn(globalThis, 'fetch') - that's handled by CallExpression
          const { parent } = node;
          if (
            parent.type === AST_NODE_TYPES.CallExpression &&
            parent.callee.type === AST_NODE_TYPES.MemberExpression &&
            parent.callee.object.type === AST_NODE_TYPES.Identifier &&
            parent.callee.object.name === 'jest' &&
            (parent.callee.property.type === AST_NODE_TYPES.Identifier ||
              parent.callee.property.type === AST_NODE_TYPES.PrivateIdentifier) &&
            parent.callee.property.name === 'spyOn'
          ) {
            return;
          }

          ctx.report({
            node,
            messageId: 'noFetchInProxy',
          });
        }
      },
      CallExpression: (node: TSESTree.CallExpression): void => {
        const { callee } = node;

        // Check for direct fetch() calls
        if (callee.type === AST_NODE_TYPES.Identifier && callee.name === 'fetch') {
          ctx.report({
            node,
            messageId: 'noFetchInProxy',
          });
          return;
        }

        // Check for jest.spyOn(globalThis, 'fetch')
        if (
          callee.type === AST_NODE_TYPES.MemberExpression &&
          callee.object.type === AST_NODE_TYPES.Identifier &&
          callee.object.name === 'jest' &&
          (callee.property.type === AST_NODE_TYPES.Identifier ||
            callee.property.type === AST_NODE_TYPES.PrivateIdentifier) &&
          callee.property.name === 'spyOn'
        ) {
          const args = node.arguments;
          const [firstArg, secondArg] = args;

          if (
            firstArg?.type === AST_NODE_TYPES.Identifier &&
            firstArg.name === 'globalThis' &&
            secondArg?.type === AST_NODE_TYPES.Literal &&
            secondArg.value === 'fetch'
          ) {
            ctx.report({
              node,
              messageId: 'noFetchInProxy',
            });
          }
        }
      },
    };
  },
});
