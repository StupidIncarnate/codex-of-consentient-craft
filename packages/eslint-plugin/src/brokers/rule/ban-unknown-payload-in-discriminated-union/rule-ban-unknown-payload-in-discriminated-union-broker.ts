/**
 * PURPOSE: Bans `z.unknown()` (and `z.record(*, z.unknown())`) payload fields inside `z.discriminatedUnion` variants — discriminated unions exist to be parsed exhaustively, and an `unknown` payload erases that guarantee. Fields suffixed with `Raw` are exempt for legitimate third-party event passthrough.
 *
 * USAGE:
 * const rule = ruleBanUnknownPayloadInDiscriminatedUnionBroker();
 * // Returns ESLint rule that flags z.unknown() / z.record(*, z.unknown()) properties inside z.discriminatedUnion(tag, [variants]) calls
 */
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { checkDiscriminatedUnionVariantsLayerBroker } from './check-discriminated-union-variants-layer-broker';

export const ruleBanUnknownPayloadInDiscriminatedUnionBroker = (): TSESLint.RuleModule<
  'banUnknownPayload' | 'banUnknownRecordPayload'
> => ({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Ban z.unknown() (and z.record(*, z.unknown())) payload fields inside z.discriminatedUnion variants — discriminated unions must parse exhaustively. Suffix the field with "Raw" to bypass for genuine third-party passthrough.',
    },
    messages: {
      banUnknownPayload:
        'Field "{{propertyName}}" inside a z.discriminatedUnion variant cannot be z.unknown(). Define a typed schema, or rename the field with a "Raw" suffix if it is intentional third-party passthrough.',
      banUnknownRecordPayload:
        'Field "{{propertyName}}" inside a z.discriminatedUnion variant cannot be z.record(*, z.unknown()). Define a typed value schema, or rename the field with a "Raw" suffix if it is intentional third-party passthrough.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;

    return {
      CallExpression: (node: TSESTree.CallExpression): void => {
        checkDiscriminatedUnionVariantsLayerBroker({ node, ctx });
      },
    };
  },
});
