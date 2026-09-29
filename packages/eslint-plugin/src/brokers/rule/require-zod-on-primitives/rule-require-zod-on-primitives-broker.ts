/**
 * PURPOSE: Creates ESLint rule that requires .brand() chaining on z.string() and z.number() calls
 *
 * USAGE:
 * const rule = ruleRequireZodOnPrimitivesBroker();
 * // Returns RuleModule that enforces branded types: z.string().brand<'Type'>() instead of z.string()
 *
 * WHEN-TO-USE: When registering ESLint rules to enforce type branding for primitive Zod schemas
 */
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isAstBrandInChainGuard } from '../../../guards/is-ast-brand-in-chain/is-ast-brand-in-chain-guard';

export const ruleRequireZodOnPrimitivesBroker = (): TSESLint.RuleModule<
  'requireBrandString' | 'requireBrandNumber'
> => ({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require .brand() chaining on z.string() and z.number() calls',
    },
    messages: {
      requireBrandString:
        "z.string() must be chained with .brand() - use z.string().email().brand<'EmailAddress'>() instead of z.string().email()",
      requireBrandNumber:
        "z.number() must be chained with .brand() - use z.number().positive().brand<'PositiveNumber'>() instead of z.number().positive()",
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    return {
      'CallExpression[callee.object.name="z"][callee.property.name="string"]': (
        node: TSESTree.CallExpression,
      ): void => {
        if (!isAstBrandInChainGuard({ node })) {
          ctx.report({
            node,
            messageId: 'requireBrandString',
          });
        }
      },
      'CallExpression[callee.object.name="z"][callee.property.name="number"]': (
        node: TSESTree.CallExpression,
      ): void => {
        if (!isAstBrandInChainGuard({ node })) {
          ctx.report({
            node,
            messageId: 'requireBrandNumber',
          });
        }
      },
    };
  },
});
