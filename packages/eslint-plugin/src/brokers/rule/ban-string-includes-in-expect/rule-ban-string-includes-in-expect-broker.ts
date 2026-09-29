/**
 * PURPOSE: Bans expect(x.includes(y)).toBe(true) pattern — use exact string assertions instead
 *
 * USAGE:
 * const rule = ruleBanStringIncludesInExpectBroker();
 * // Returns ESLint rule that prevents wrapping .includes() inside expect()
 *
 * WHEN-TO-USE: When registering ESLint rules to enforce exact string assertions over substring checks
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';

import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';
import { isAstIncludesCallGuard } from '../../../guards/is-ast-includes-call/is-ast-includes-call-guard';

export const ruleBanStringIncludesInExpectBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ban expect(x.includes(y)).toBe(true) — use .toBe() or .toMatch(/^exact$/u) for full string assertions.',
      },
      messages: {
        noIncludesInExpect:
          'Do not use .includes() inside expect(). Assert the full string value with .toBe() or use anchored .toMatch(/^exact$/u).',
      },
      schema: [],
    },
  }),
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    const isTestFile = isTestFileGuard({ filename: ctx.filename });

    if (!isTestFile) {
      return {};
    }

    const includesVariables = new Set<string>();

    return {
      VariableDeclarator: (node: TSESTree.VariableDeclarator): void => {
        if (node.id.type !== AST_NODE_TYPES.Identifier) {
          return;
        }

        if (isAstIncludesCallGuard({ node: node.init })) {
          includesVariables.add(node.id.name);
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

        // Check if the argument is something.includes(...) directly
        if (isAstIncludesCallGuard({ node: firstArg })) {
          ctx.report({
            node,
            messageId: 'noIncludesInExpect',
          });
          return;
        }

        // Check if the argument is a variable assigned from .includes(...)
        if (firstArg.type === AST_NODE_TYPES.Identifier && includesVariables.has(firstArg.name)) {
          ctx.report({
            node,
            messageId: 'noIncludesInExpect',
          });
        }
      },
    };
  },
});
