/**
 * PURPOSE: Creates ESLint rule that forbids mutable state (let/var) anywhere in proxy files
 *
 * USAGE:
 * const rule = ruleNoMutableStateInProxyFactoryBroker();
 * // Returns EslintRule that reports errors on any let/var declarations in .proxy.ts files
 *
 * WHEN-TO-USE: When registering ESLint rules to enforce immutability in proxy factory patterns
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';

export const ruleNoMutableStateInProxyFactoryBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description: 'Forbid mutable state (let/var) anywhere in proxy files',
      },
      messages: {
        noMutableState:
          'Proxy files cannot contain mutable state (let/var). Use const for all variables.',
      },
      schema: [],
    },
  }),
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    const { filename } = ctx;

    // Only check .proxy.ts files
    if (!hasFileSuffixGuard({ filename, suffix: 'proxy' })) {
      return {};
    }

    return {
      // Check for let/var declarations anywhere in the file
      VariableDeclaration: (node: TSESTree.VariableDeclaration): void => {
        const { kind, declarations } = node;

        // Only check let and var (const is fine)
        if (kind !== 'let' && kind !== 'var') return;

        if (declarations.length === 0) return;

        // Report ALL let/var declarations - no exceptions
        for (const declaration of declarations) {
          ctx.report({
            node: declaration,
            messageId: 'noMutableState',
          });
        }
      },
    };
  },
});
