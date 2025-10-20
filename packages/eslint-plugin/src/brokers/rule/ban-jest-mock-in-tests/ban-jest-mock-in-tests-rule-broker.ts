import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';

export const banJestMockInTestsRuleBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ban all Jest mocking and module system manipulation in test files. Use proxy files instead.',
      },
      messages: {
        noMockingInTests:
          'Test files must not use {{mockFunction}}(). All mocking and module system manipulation must be done in proxy files (.proxy.ts).',
        noCleanupFunctions:
          'Never use {{mockFunction}}() - @questmaestro/testing handles mock cleanup globally. Manual cleanup causes issues across tests.',
      },
      schema: [],
    },
  }),
  create: (context: unknown) => {
    const ctx = context as EslintContext;
    return {
      CallExpression: (node: Tsestree): void => {
        const isTestFile = isTestFileGuard({ filename: ctx.filename ?? '' });

        // Check if this is a jest function call
        const { callee } = node;

        const isJestCall =
          callee?.type === 'MemberExpression' &&
          callee.object?.name === 'jest' &&
          callee.property?.name !== undefined;

        if (!isJestCall) {
          return;
        }

        const functionName = callee.property?.name ?? 'unknown';

        // Mock cleanup functions are NEVER allowed anywhere (test files, proxy files, regular files)
        const cleanupFunctions = [
          'clearAllMocks',
          'resetAllMocks',
          'restoreAllMocks',
          'resetModuleRegistry',
        ];

        if (cleanupFunctions.includes(functionName)) {
          ctx.report({
            node,
            messageId: 'noCleanupFunctions',
            data: {
              mockFunction: `jest.${functionName}`,
            },
          });
          return;
        }

        // Other mocking functions only banned in test files (not proxy files)
        if (!isTestFile) {
          return;
        }

        // Ban all Jest mocking and module system manipulation functions in test files
        const bannedFunctions = [
          // Module mocking
          'mock',
          'unmock',
          'deepUnmock',
          'dontMock',
          'doMock',
          'setMock',
          'createMockFromModule',
          // Spying
          'spyOn',
          // Mock utilities
          'mocked',
          // Module system
          'requireActual',
          'requireMock',
          'resetModules',
          'isolateModules',
          'isolateModulesAsync',
          // Property mocking
          'replaceProperty',
        ];

        if (!bannedFunctions.includes(functionName)) {
          return;
        }

        ctx.report({
          node,
          messageId: 'noMockingInTests',
          data: {
            mockFunction: `jest.${functionName}`,
          },
        });
      },
    };
  },
});
