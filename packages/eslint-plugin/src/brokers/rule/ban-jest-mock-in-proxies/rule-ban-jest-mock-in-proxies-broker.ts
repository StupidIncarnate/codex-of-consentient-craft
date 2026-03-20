/**
 * PURPOSE: Bans jest.mock(), jest.mocked(), jest.spyOn() in proxy files to enforce registerMock usage
 *
 * USAGE:
 * const rule = ruleBanJestMockInProxiesBroker();
 * // Returns ESLint rule that prevents direct Jest mocking in proxy files
 *
 * WHEN-TO-USE: When enforcing that all mocking in proxy files uses registerMock from @dungeonmaster/testing
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';
import { jestMockingStatics } from '../../../statics/jest-mocking/jest-mocking-statics';

export const ruleBanJestMockInProxiesBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ban jest.mock(), jest.mocked(), jest.spyOn() and other Jest mocking in proxy files. Use registerMock from @dungeonmaster/testing/register-mock instead.',
      },
      messages: {
        useRegisterMock:
          'Proxy files must not use {{mockFunction}}(). Use registerMock({ fn }) from @dungeonmaster/testing/register-mock instead.',
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;

    // Only check proxy files
    if (!hasFileSuffixGuard({ filename: ctx.filename ?? '', suffix: 'proxy' })) {
      return {};
    }

    return {
      CallExpression: (node: Tsestree): void => {
        const { callee } = node;

        const isJestCall =
          callee?.type === 'MemberExpression' &&
          callee.object?.name === 'jest' &&
          callee.property?.name !== undefined;

        if (!isJestCall) {
          return;
        }

        const functionName = callee.property?.name ?? 'unknown';

        const isBannedFunction = jestMockingStatics.bannedFunctions.some(
          (fn) => fn === functionName,
        );

        if (!isBannedFunction) {
          return;
        }

        ctx.report({
          node,
          messageId: 'useRegisterMock',
          data: {
            mockFunction: `jest.${functionName}`,
          },
        });
      },
    };
  },
});
