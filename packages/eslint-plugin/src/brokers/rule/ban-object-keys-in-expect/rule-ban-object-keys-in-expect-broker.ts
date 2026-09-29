/**
 * PURPOSE: Bans expect(Object.keys(...)) usage — assert full object shape instead of just keys
 *
 * USAGE:
 * const rule = ruleBanObjectKeysInExpectBroker();
 * // Returns ESLint rule that prevents Object.keys() inside expect()
 *
 * WHEN-TO-USE: When registering ESLint rules to enforce asserting both keys and values
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';

import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';
import { isAstObjectKeysCallGuard } from '../../../guards/is-ast-object-keys-call/is-ast-object-keys-call-guard';

export const ruleBanObjectKeysInExpectBroker = (): TSESLint.RuleModule<'noObjectKeysInExpect'> => ({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Ban expect(Object.keys(...)) — assert full object shape with .toStrictEqual() instead of just keys.',
    },
    messages: {
      noObjectKeysInExpect:
        'Do not use Object.keys() inside expect(). Assert the full object shape with .toStrictEqual() to verify both keys and values.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    const isTestFile = isTestFileGuard({ filename: ctx.filename });

    if (!isTestFile) {
      return {};
    }

    const objectKeysVariables = new Set<string>();

    return {
      VariableDeclarator: (node: TSESTree.VariableDeclarator): void => {
        if (node.id.type !== AST_NODE_TYPES.Identifier) {
          return;
        }

        if (isAstObjectKeysCallGuard({ node: node.init })) {
          objectKeysVariables.add(node.id.name);
        }
      },

      CallExpression: (node: TSESTree.CallExpression): void => {
        const { callee } = node;

        // Check if this is expect(...)
        if (callee.type !== AST_NODE_TYPES.Identifier || callee.name !== 'expect') {
          return;
        }

        const [firstArg] = node.arguments;
        if (firstArg === undefined) {
          return;
        }

        // Check if the argument is Object.keys(...) directly
        if (isAstObjectKeysCallGuard({ node: firstArg })) {
          ctx.report({
            node,
            messageId: 'noObjectKeysInExpect',
          });
          return;
        }

        // Check if the argument is a variable assigned from Object.keys(...)
        if (firstArg.type === AST_NODE_TYPES.Identifier && objectKeysVariables.has(firstArg.name)) {
          ctx.report({
            node,
            messageId: 'noObjectKeysInExpect',
          });
        }
      },
    };
  },
});
