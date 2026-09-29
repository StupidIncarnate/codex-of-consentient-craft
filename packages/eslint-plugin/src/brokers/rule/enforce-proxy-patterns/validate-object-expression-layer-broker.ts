/**
 * PURPOSE: Layer helper that validates object expressions in proxy returns for forbidden properties and naming
 *
 * USAGE:
 * validateObjectExpressionLayerBroker({ objectNode, context });
 * // Reports error if object has 'bootstrap' property or helper names contain 'mock', 'spy', etc.
 */
import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { proxyPatternsStatics } from '../../../statics/proxy-patterns/proxy-patterns-statics';

export const validateObjectExpressionLayerBroker = ({
  objectNode,
  context,
}: {
  objectNode: TSESTree.ObjectExpression;
  context: TSESLint.RuleContext<string, unknown[]>;
}): AdapterResult => {
  const result = adapterResultContract.parse({ success: true });

  // Check for bootstrap property and mock in helper names
  for (const property of objectNode.properties) {
    if (property.type === AST_NODE_TYPES.Property) {
      const { key } = property;
      const keyName = 'name' in key ? key.name : undefined;

      if (keyName === 'bootstrap') {
        context.report({
          node: property,
          messageId: 'proxyNoBootstrapMethod',
        });
      }

      // Check if helper name contains forbidden implementation-revealing words
      if (keyName) {
        const foundWord = proxyPatternsStatics.forbiddenWords.find((word) =>
          new RegExp(word, 'iu').test(keyName),
        );

        if (foundWord) {
          context.report({
            node: property,
            messageId: 'proxyHelperNoMockInName',
            data: { name: keyName, forbiddenWord: foundWord },
          });
        }
      }
    }
  }
  return result;
};
