import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';

export const ruleBanPrimitivesBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description: 'Ban raw string and number types in favor of Zod contract types',
      },
      messages: {
        banPrimitive:
          'Raw {{typeName}} type is not allowed. Use Zod contract types like {{suggestion}} instead.',
      },
      schema: [],
    },
  }),
  create: (context: unknown) => {
    const ctx = context as EslintContext;
    const filename = ctx.getFilename?.() ?? '';

    // Skip stub files - they need to use primitives for type conversion
    if (hasFileSuffixGuard({ filename: String(filename), suffix: 'stub' })) {
      return {};
    }

    return {
      TSStringKeyword: (node: Tsestree): void => {
        ctx.report({
          node,
          messageId: 'banPrimitive',
          data: {
            typeName: 'string',
            suggestion: 'EmailAddress, UserName, FilePath, etc.',
          },
        });
      },
      TSNumberKeyword: (node: Tsestree): void => {
        ctx.report({
          node,
          messageId: 'banPrimitive',
          data: {
            typeName: 'number',
            suggestion: 'Currency, PositiveNumber, Age, etc.',
          },
        });
      },
    };
  },
});
