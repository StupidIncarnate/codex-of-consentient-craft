import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';

export const ruleNoMutableStateInProxyFactoryBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description: 'Forbid mutable state (let/var) anywhere in proxy files',
      },
      messages: {
        noMutableState:
          'Proxy files cannot contain mutable state (let/var). Use const for all variables.',
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    const filename = ctx.filename ?? '';

    // Only check .proxy.ts files
    if (!hasFileSuffixGuard({ filename, suffix: 'proxy' })) {
      return {};
    }

    return {
      // Check for let/var declarations anywhere in the file
      VariableDeclaration: (node: Tsestree): void => {
        const { kind, declarations } = node;

        // Only check let and var (const is fine)
        if (kind !== 'let' && kind !== 'var') return;

        if (!declarations || declarations.length === 0) return;

        // Report ALL let/var declarations - no exceptions
        for (const declaration of declarations) {
          ctx.report({
            node: declaration,
            messageId: 'noMutableState',
          });
        }
      },
    };
  },
});
