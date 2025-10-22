import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';
import { checkPrimitiveViolationLayerBroker } from './check-primitive-violation-layer-broker';

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
      schema: [
        {
          type: 'object',
          properties: {
            allowPrimitiveInputs: {
              type: 'boolean',
              description: 'Allow raw primitives in function parameters',
            },
            allowPrimitiveReturns: {
              type: 'boolean',
              description: 'Allow raw primitives in function return types',
            },
          },
          additionalProperties: false,
        },
      ],
    },
  }),
  create: (context: unknown) => {
    const ctx = context as EslintContext & {
      options?: { allowPrimitiveInputs?: boolean; allowPrimitiveReturns?: boolean }[];
    };
    const filename = ctx.getFilename?.() ?? undefined;

    // Get rule options (default both to false)
    const options = ctx.options?.[0] ?? {};
    const allowPrimitiveInputs = options.allowPrimitiveInputs ?? false;
    const allowPrimitiveReturns = options.allowPrimitiveReturns ?? false;

    // Skip stub files - they need to use primitives for type conversion
    if (filename && hasFileSuffixGuard({ filename, suffix: 'stub' })) {
      return {};
    }

    return {
      TSStringKeyword: (node: Tsestree): void => {
        checkPrimitiveViolationLayerBroker({
          node,
          typeName: 'string',
          suggestion: 'EmailAddress, UserName, FilePath, etc.',
          allowPrimitiveInputs,
          allowPrimitiveReturns,
          ctx,
        });
      },
      TSNumberKeyword: (node: Tsestree): void => {
        checkPrimitiveViolationLayerBroker({
          node,
          typeName: 'number',
          suggestion: 'Currency, PositiveNumber, Age, etc.',
          allowPrimitiveInputs,
          allowPrimitiveReturns,
          ctx,
        });
      },
    };
  },
});
