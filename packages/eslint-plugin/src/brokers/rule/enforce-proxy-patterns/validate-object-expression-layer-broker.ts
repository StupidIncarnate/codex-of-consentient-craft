import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';

export const validateObjectExpressionLayerBroker = (
  objectNode: Tsestree,
  context: EslintContext,
): void => {
  const { properties } = objectNode;

  if (!properties) return;

  // Check for bootstrap property and mock in helper names
  for (const property of properties) {
    if (property.type === 'Property' || property.type === 'MethodDefinition') {
      const { key } = property;
      const keyName = key?.name;

      if (keyName === 'bootstrap') {
        context.report({
          node: property,
          messageId: 'proxyNoBootstrapMethod',
        });
      }

      // Check if helper name contains forbidden implementation-revealing words
      if (keyName) {
        const forbiddenWords = ['mock', 'stub', 'fake', 'spy', 'jest', 'dummy'];
        const foundWord = forbiddenWords.find((word) => new RegExp(word, 'iu').test(keyName));

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
};
