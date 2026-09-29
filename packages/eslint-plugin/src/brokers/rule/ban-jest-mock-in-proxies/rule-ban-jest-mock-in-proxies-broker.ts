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
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
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
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;

    // Only check proxy files
    if (!hasFileSuffixGuard({ filename: ctx.filename, suffix: 'proxy' })) {
      return {};
    }

    return {
      CallExpression: (node: TSESTree.CallExpression): void => {
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

        const isBannedFunction = jestMockingStatics.bannedFunctions.some(
          (fn) => fn === functionName,
        );

        if (!isBannedFunction) {
          return;
        }

        // Allow jest.requireActual and jest.fn inside registerModuleMock factory callbacks
        // These are hoisted by the AST transformer into jest.mock(module, factory) calls
        if (functionName === 'requireActual' || functionName === 'fn') {
          let ancestor: TSESTree.Node | undefined = node.parent;
          while (ancestor) {
            if (
              ancestor.type === AST_NODE_TYPES.CallExpression &&
              ancestor.callee.type === AST_NODE_TYPES.Identifier &&
              ancestor.callee.name === 'registerModuleMock'
            ) {
              return;
            }
            ancestor = ancestor.parent;
          }
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
