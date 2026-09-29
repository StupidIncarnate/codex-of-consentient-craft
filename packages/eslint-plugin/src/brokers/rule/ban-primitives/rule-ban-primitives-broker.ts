/**
 * PURPOSE: Bans raw string and number types in favor of Zod contract types for type safety
 *
 * USAGE:
 * const rule = ruleBanPrimitivesBroker();
 * // Returns ESLint rule that prevents `string` and `number` types, requiring branded types like EmailAddress, FilePath
 */
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';
import { isGatewayFileGuard } from '../../../guards/is-gateway-file/is-gateway-file-guard';
import { checkPrimitiveViolationLayerBroker } from './check-primitive-violation-layer-broker';

export const ruleBanPrimitivesBroker = (): TSESLint.RuleModule<'banPrimitive'> => ({
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban raw string and number types in favor of Zod contract types',
    },
    messages: {
      banPrimitive:
        'Raw {{typeName}} type is not allowed. Use the discover endpoint to search for existing contracts (e.g., {{suggestion}}). If none fits, create a new contract.',
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
  defaultOptions: [],
  create: (context: unknown) => {
    const ctx = context as TSESLint.RuleContext<string, unknown[]> & {
      options?: { allowPrimitiveInputs?: boolean; allowPrimitiveReturns?: boolean }[];
    };
    const { filename } = ctx;

    // Get rule options (default both to false)
    const options = ctx.options[0] ?? {};
    const allowPrimitiveInputs = options.allowPrimitiveInputs ?? false;
    const allowPrimitiveReturns = options.allowPrimitiveReturns ?? false;

    // Skip stub files - they need to use primitives for type conversion
    if (hasFileSuffixGuard({ filename, suffix: 'stub' })) {
      return {};
    }

    // Skip .d.ts declaration files - they define external types and need primitives
    if (filename.endsWith('.d.ts')) {
      return {};
    }

    // Skip the gateway (implementation AND test): its wrappers take and return the outside
    // package's own plain values, never a branded contract — this applies repo-wide (also
    // covers gateway .test.ts, which the config carve-out's implementation-only scope cannot).
    if (filename && isGatewayFileGuard({ filename })) {
      return {};
    }

    return {
      TSStringKeyword: (node: TSESTree.TSStringKeyword): void => {
        checkPrimitiveViolationLayerBroker({
          node,
          typeName: 'string',
          suggestion: 'EmailAddress, UserName, FilePath, etc.',
          allowPrimitiveInputs,
          allowPrimitiveReturns,
          ctx,
        });
      },
      TSNumberKeyword: (node: TSESTree.TSNumberKeyword): void => {
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
