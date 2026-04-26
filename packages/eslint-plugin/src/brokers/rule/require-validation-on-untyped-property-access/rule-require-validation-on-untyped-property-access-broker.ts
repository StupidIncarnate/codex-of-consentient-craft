/**
 * PURPOSE: Requires Zod-contract validation before accessing properties on untyped values; flags `Reflect.get` and `JSON.parse(...).field` access lacking validation
 *
 * USAGE:
 * const rule = ruleRequireValidationOnUntypedPropertyAccessBroker();
 * // Returns ESLint rule that flags Reflect.get and post-JSON.parse property access lacking a contract.parse() chain
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isStubFileGuard } from '../../../guards/is-stub-file/is-stub-file-guard';
import { checkBindingInitializerLayerBroker } from './check-binding-initializer-layer-broker';
import { checkIsValidatedExpressionLayerBroker } from './check-is-validated-expression-layer-broker';
import { checkIsJsonParseCallLayerBroker } from './check-is-json-parse-call-layer-broker';

export const ruleRequireValidationOnUntypedPropertyAccessBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
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
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    const filename = ctx.getFilename?.() ?? ctx.filename;
    const filenameStr = filename ? String(filename) : '';

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
      CallExpression: (node: Tsestree): void => {
        const { callee } = node;
        if (
          !callee ||
          callee.type !== 'MemberExpression' ||
          !callee.object ||
          callee.object.type !== 'Identifier' ||
          callee.object.name !== 'Reflect' ||
          !callee.property ||
          callee.property.type !== 'Identifier' ||
          callee.property.name !== 'get'
        ) {
          return;
        }
        const args = node.arguments ?? [];
        const [firstArg] = args;
        if (!firstArg) {
          return;
        }

        if (checkIsValidatedExpressionLayerBroker({ node: firstArg })) {
          return;
        }

        if (firstArg.type === 'Identifier') {
          const init = checkBindingInitializerLayerBroker({ identifierNode: firstArg });
          if (init && checkIsValidatedExpressionLayerBroker({ node: init })) {
            return;
          }
        }

        ctx.report({ node, messageId: 'reflectGetWithoutValidation' });
      },

      MemberExpression: (node: Tsestree): void => {
        const { object } = node;
        if (!object) {
          return;
        }

        // Direct: JSON.parse(s).field
        if (checkIsJsonParseCallLayerBroker({ node: object })) {
          ctx.report({ node, messageId: 'jsonParseWithoutValidation' });
          return;
        }

        // Same-block alias: const x = JSON.parse(s); x.field
        if (object.type === 'Identifier') {
          const init = checkBindingInitializerLayerBroker({ identifierNode: object });
          if (init && checkIsJsonParseCallLayerBroker({ node: init })) {
            ctx.report({ node, messageId: 'jsonParseWithoutValidation' });
          }
        }
      },
    };
  },
});
