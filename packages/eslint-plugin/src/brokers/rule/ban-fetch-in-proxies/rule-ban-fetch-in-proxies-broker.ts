/**
 * PURPOSE: Bans direct fetch usage and fetch mocking in proxy files to enforce using StartEndpointMock from @dungeonmaster/testing
 *
 * USAGE:
 * const rule = ruleBanFetchInProxiesBroker();
 * // Returns ESLint rule that prevents globalThis.fetch, fetch(), and jest.spyOn(globalThis, 'fetch') in proxy files
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
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
  create: (context: EslintContext) => {
    const ctx = context;
    const filename = ctx.filename ?? '';

    const isProxyFile = hasFileSuffixGuard({ filename, suffix: 'proxy' });

    if (!isProxyFile) {
      return {};
    }

    return {
      MemberExpression: (node: Tsestree): void => {
        // Check for globalThis.fetch
        const { object, property } = node;

        if (
          object?.type === 'Identifier' &&
          object.name === 'globalThis' &&
          property?.type === 'Identifier' &&
          property.name === 'fetch'
        ) {
          // Skip if this is part of jest.spyOn(globalThis, 'fetch') - that's handled by CallExpression
          const { parent } = node;
          if (
            parent?.type === 'CallExpression' &&
            parent.callee?.type === 'MemberExpression' &&
            parent.callee.object?.name === 'jest' &&
            parent.callee.property?.name === 'spyOn'
          ) {
            return;
          }

          ctx.report({
            node,
            messageId: 'noFetchInProxy',
          });
        }
      },
      CallExpression: (node: Tsestree): void => {
        const { callee } = node;

        // Check for direct fetch() calls
        if (callee?.type === 'Identifier' && callee.name === 'fetch') {
          ctx.report({
            node,
            messageId: 'noFetchInProxy',
          });
          return;
        }

        // Check for jest.spyOn(globalThis, 'fetch')
        if (
          callee?.type === 'MemberExpression' &&
          callee.object?.name === 'jest' &&
          callee.property?.name === 'spyOn'
        ) {
          const args = node.arguments ?? [];
          const [firstArg, secondArg] = args;

          if (
            firstArg?.type === 'Identifier' &&
            firstArg.name === 'globalThis' &&
            secondArg?.type === 'Literal' &&
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
