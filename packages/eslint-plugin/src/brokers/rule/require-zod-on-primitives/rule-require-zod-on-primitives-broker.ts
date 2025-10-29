import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isAstBrandInChainGuard } from '../../../guards/is-ast-brand-in-chain/is-ast-brand-in-chain-guard';

/**
 * PURPOSE: Creates ESLint rule that requires .brand() chaining on z.string() and z.number() calls
 *
 * USAGE:
 * const rule = ruleRequireZodOnPrimitivesBroker();
 * // Returns EslintRule that enforces branded types: z.string().brand<'Type'>() instead of z.string()
 *
 * WHEN-TO-USE: When registering ESLint rules to enforce type branding for primitive Zod schemas
 */
export const ruleRequireZodOnPrimitivesBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
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
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    return {
      'CallExpression[callee.object.name="z"][callee.property.name="string"]': (
        node: Tsestree,
      ): void => {
        if (!isAstBrandInChainGuard({ node })) {
          ctx.report({
            node,
            messageId: 'requireBrandString',
          });
        }
      },
      'CallExpression[callee.object.name="z"][callee.property.name="number"]': (
        node: Tsestree,
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
