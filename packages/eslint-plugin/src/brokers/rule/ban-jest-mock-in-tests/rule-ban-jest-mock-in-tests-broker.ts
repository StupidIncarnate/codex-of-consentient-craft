/**
 * PURPOSE: Bans Jest mocking and module system manipulation in test files to enforce using proxy files instead
 *
 * USAGE:
 * const rule = ruleBanJestMockInTestsBroker();
 * // Returns ESLint rule that prevents jest.mock(), jest.clearAllMocks(), etc. in test files
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';
import { jestTestingStatics } from '../../../statics/jest-testing/jest-testing-statics';
import { jestMockingStatics } from '../../../statics/jest-mocking/jest-mocking-statics';

export const ruleBanJestMockInTestsBroker = (): TSESLint.RuleModule<
  'noMockingInTests' | 'noCleanupFunctions'
> => ({
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
        'Never use {{mockFunction}}() - @dungeonmaster/testing handles mock cleanup globally. Manual cleanup causes issues across tests.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    return {
      CallExpression: (node: TSESTree.CallExpression): void => {
        const isTestFile = isTestFileGuard({ filename: ctx.filename });

        // Check if this is a jest function call
        const { callee } = node;

        const isJestCall =
          callee.type === AST_NODE_TYPES.MemberExpression &&
          callee.object.type === AST_NODE_TYPES.Identifier &&
          callee.object.name === 'jest' &&
          (callee.property.type === AST_NODE_TYPES.Identifier ||
          callee.property.type === AST_NODE_TYPES.PrivateIdentifier
            ? callee.property.name
            : undefined) !== undefined;

        if (!isJestCall) {
          return;
        }

        const functionName =
          (callee.property.type === AST_NODE_TYPES.Identifier ||
          callee.property.type === AST_NODE_TYPES.PrivateIdentifier
            ? callee.property.name
            : undefined) ?? 'unknown';

        // Mock cleanup functions are NEVER allowed anywhere (test files, proxy files, regular files)
        const isCleanupFunction = jestTestingStatics.cleanupFunctions.some(
          (fn) => fn === functionName,
        );

        if (isCleanupFunction) {
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
        const isBannedFunction = jestMockingStatics.bannedFunctions.some(
          (fn) => fn === functionName,
        );

        if (!isBannedFunction) {
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
