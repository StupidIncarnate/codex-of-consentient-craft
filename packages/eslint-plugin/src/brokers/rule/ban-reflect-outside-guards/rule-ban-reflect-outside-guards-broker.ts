/**
 * PURPOSE: Bans Reflect.get and Reflect.set calls outside of *-guard.ts and *-contract.ts files
 *
 * USAGE:
 * const rule = ruleBanReflectOutsideGuardsBroker();
 * // Returns ESLint rule that prevents Reflect.get / Reflect.set in brokers, transformers, etc.
 * // Reflect.deleteProperty is NOT banned.
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const ruleBanReflectOutsideGuardsBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ban Reflect.get and Reflect.set outside of *-guard.ts and *-contract.ts files. Validate untyped property access through a Zod contract instead.',
      },
      messages: {
        banReflectOutsideGuards:
          'Reflect.{{method}} is only allowed in *-guard.ts and *-contract.ts files. Validate the value through a Zod contract (e.g., someContract.parse(x).y) instead of using Reflect.{{method}} as an escape hatch.',
      },
      schema: [],
    },
  }),
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    const { filename } = ctx;

    if (
      filename.endsWith('-guard.ts') ||
      filename.endsWith('-guard.tsx') ||
      filename.endsWith('-contract.ts') ||
      filename.endsWith('-contract.tsx')
    ) {
      return {};
    }

    return {
      CallExpression: (node: TSESTree.CallExpression): void => {
        const { callee } = node;

        if (callee.type !== AST_NODE_TYPES.MemberExpression) return;
        if (callee.object.type !== AST_NODE_TYPES.Identifier) return;
        if (callee.object.name !== 'Reflect') return;

        const propertyName =
          callee.property.type === AST_NODE_TYPES.Identifier ||
          callee.property.type === AST_NODE_TYPES.PrivateIdentifier
            ? callee.property.name
            : undefined;

        if (propertyName !== 'get' && propertyName !== 'set') return;

        ctx.report({
          node,
          messageId: 'banReflectOutsideGuards',
          data: { method: propertyName },
        });
      },
    };
  },
});
