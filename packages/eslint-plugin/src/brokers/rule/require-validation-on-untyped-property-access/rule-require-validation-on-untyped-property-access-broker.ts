/**
 * PURPOSE: Requires Zod-contract validation before accessing properties on untyped values; flags `Reflect.get` and `JSON.parse(...).field` access lacking validation
 *
 * USAGE:
 * const rule = ruleRequireValidationOnUntypedPropertyAccessBroker();
 * // Returns ESLint rule that flags Reflect.get and post-JSON.parse property access lacking a contract.parse() chain
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isStubFileGuard } from '../../../guards/is-stub-file/is-stub-file-guard';
import { checkBindingInitializerLayerBroker } from './check-binding-initializer-layer-broker';
import { checkIsValidatedExpressionLayerBroker } from './check-is-validated-expression-layer-broker';
import { checkIsJsonParseCallLayerBroker } from './check-is-json-parse-call-layer-broker';

export const ruleRequireValidationOnUntypedPropertyAccessBroker = (): TSESLint.RuleModule<
  'reflectGetWithoutValidation' | 'jsonParseWithoutValidation'
> => ({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require Zod-contract validation before property access on untyped values; flag Reflect.get and JSON.parse(...).field access lacking validation',
    },
    messages: {
      reflectGetWithoutValidation:
        'Reflect.get(...) requires its first argument to be the result of a Zod contract `.parse()` (inline or same-block alias). Validate the value through a contract before accessing properties.',
      jsonParseWithoutValidation:
        'JSON.parse(...) result must be validated by a Zod contract `.parse()` before property access. Wrap the parsed value in `someContract.parse(...)`.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    const { filename } = ctx;
    const filenameStr = filename ? filename : '';

    if (isStubFileGuard({ filename: filenameStr })) {
      return {};
    }
    if (
      filenameStr.endsWith('-guard.ts') ||
      filenameStr.endsWith('-guard.tsx') ||
      filenameStr.endsWith('-contract.ts') ||
      filenameStr.endsWith('-adapter.ts')
    ) {
      return {};
    }

    return {
      CallExpression: (node: TSESTree.CallExpression): void => {
        const { callee } = node;
        if (
          callee.type !== AST_NODE_TYPES.MemberExpression ||
          callee.object.type !== AST_NODE_TYPES.Identifier ||
          callee.object.name !== 'Reflect' ||
          callee.property.type !== AST_NODE_TYPES.Identifier ||
          callee.property.name !== 'get'
        ) {
          return;
        }
        const args = node.arguments;
        const [firstArg] = args;
        if (!firstArg) {
          return;
        }

        if (checkIsValidatedExpressionLayerBroker({ node: firstArg })) {
          return;
        }

        if (firstArg.type === AST_NODE_TYPES.Identifier) {
          const init = checkBindingInitializerLayerBroker({ identifierNode: firstArg });
          if (init && checkIsValidatedExpressionLayerBroker({ node: init })) {
            return;
          }
        }

        ctx.report({ node, messageId: 'reflectGetWithoutValidation' });
      },

      MemberExpression: (node: TSESTree.MemberExpression): void => {
        const { object } = node;

        // Direct: JSON.parse(s).field
        if (checkIsJsonParseCallLayerBroker({ node: object })) {
          ctx.report({ node, messageId: 'jsonParseWithoutValidation' });
          return;
        }

        // Same-block alias: const x = JSON.parse(s); x.field
        if (object.type === AST_NODE_TYPES.Identifier) {
          const init = checkBindingInitializerLayerBroker({ identifierNode: object });
          if (init && checkIsJsonParseCallLayerBroker({ node: init })) {
            ctx.report({ node, messageId: 'jsonParseWithoutValidation' });
          }
        }
      },
    };
  },
});
