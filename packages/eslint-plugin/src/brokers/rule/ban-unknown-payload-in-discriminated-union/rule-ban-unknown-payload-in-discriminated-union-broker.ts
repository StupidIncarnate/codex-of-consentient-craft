/**
 * PURPOSE: Bans `z.unknown()` (and `z.record(*, z.unknown())`) payload fields inside `z.discriminatedUnion` variants — discriminated unions exist to be parsed exhaustively, and an `unknown` payload erases that guarantee. Fields suffixed with `Raw` are exempt for legitimate third-party event passthrough.
 *
 * USAGE:
 * const rule = ruleBanUnknownPayloadInDiscriminatedUnionBroker();
 * // Returns ESLint rule that flags z.unknown() / z.record(*, z.unknown()) properties inside z.discriminatedUnion(tag, [variants]) calls
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { checkDiscriminatedUnionVariantsLayerBroker } from './check-discriminated-union-variants-layer-broker';

export const ruleBanUnknownPayloadInDiscriminatedUnionBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
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
  }),
  create: (context: EslintContext) => {
    const ctx = context;

    return {
      CallExpression: (node: Tsestree): void => {
        checkDiscriminatedUnionVariantsLayerBroker({ node, ctx });
      },
    };
  },
});
