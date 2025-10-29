import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { validateObjectExpressionLayerBroker } from './validate-object-expression-layer-broker';

/**
 * PURPOSE: Layer helper that validates return statements in proxy functions return valid objects
 *
 * USAGE:
 * validateReturnStatementLayerBroker({ statement, context, functionNode });
 * // Reports error if return statement returns void, primitive, or array instead of object
 */
export const validateReturnStatementLayerBroker = ({
  statement,
  context,
  functionNode,
}: {
  statement: Tsestree;
  context: EslintContext;
  functionNode: Tsestree;
}): void => {
  if (statement.type === 'ReturnStatement') {
    const { argument } = statement;

    if (!argument) {
      // Return with no value (void)
      context.report({
        node: functionNode,
        messageId: 'proxyMustReturnObject',
      });
      return;
    }

    // Check if returning primitive or array
    if (
      argument.type === 'Literal' ||
      argument.type === 'TemplateLiteral' ||
      argument.type === 'ArrayExpression' ||
      argument.type === 'Identifier' // Could be returning a primitive variable
    ) {
      context.report({
        node: functionNode,
        messageId: 'proxyMustReturnObject',
      });
      return;
    }

    // Check if returning object
    if (argument.type === 'ObjectExpression') {
      validateObjectExpressionLayerBroker({ objectNode: argument, context });
    }
  }
};
