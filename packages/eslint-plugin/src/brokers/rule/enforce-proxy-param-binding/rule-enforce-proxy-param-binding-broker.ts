/**
 * PURPOSE: Bans declaring a property in a proxy method parameter's type annotation without binding it in the destructuring pattern
 *
 * USAGE:
 * const rule = ruleEnforceProxyParamBindingBroker();
 * // Returns ESLint rule that flags type-literal properties never destructured by the same parameter's object pattern in *.proxy.ts files
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';
import { checkUnboundTypePropertiesLayerBroker } from './check-unbound-type-properties-layer-broker';

export const ruleEnforceProxyParamBindingBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ban declaring a property in a proxy parameter type annotation without binding it in the destructuring pattern. A declared-but-unbound property advertises an argument that nothing reads.',
      },
      messages: {
        unboundProxyParam:
          'Property "{{propertyName}}" is declared in this parameter\'s type but never destructured. Bind it in the pattern, or remove it from the type if this method does not use it.',
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    const filename = ctx.filename ?? '';
    const isProxyFile = hasFileSuffixGuard({ filename, suffix: 'proxy' });

    if (!isProxyFile) {
      return {};
    }

    return {
      ArrowFunctionExpression: (node: Tsestree): void => {
        checkUnboundTypePropertiesLayerBroker({ node, ctx });
      },
      FunctionExpression: (node: Tsestree): void => {
        checkUnboundTypePropertiesLayerBroker({ node, ctx });
      },
      FunctionDeclaration: (node: Tsestree): void => {
        checkUnboundTypePropertiesLayerBroker({ node, ctx });
      },
    };
  },
});
