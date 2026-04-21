/**
 * PURPOSE: Layer helper that validates return statements in proxy functions return valid objects
 *
 * USAGE:
 * validateReturnStatementLayerBroker({ statement, context, functionNode });
 * // Reports error if return statement returns void, primitive, or array instead of object
 */
import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { validateObjectExpressionLayerBroker } from './validate-object-expression-layer-broker';

export const validateReturnStatementLayerBroker = ({
  statement,
  context,
  functionNode,
}: {
  statement: Tsestree;
  context: EslintContext;
  functionNode: Tsestree;
}): AdapterResult => {
  const result = adapterResultContract.parse({ success: true });
  if (statement.type === 'ReturnStatement') {
    const { argument } = statement;

    if (!argument) {
      context.report({
        node: functionNode,
        messageId: 'proxyMustReturnObject',
      });
      return result;
    }

    if (
      argument.type === 'Literal' ||
      argument.type === 'TemplateLiteral' ||
      argument.type === 'ArrayExpression' ||
      argument.type === 'Identifier'
    ) {
      context.report({
        node: functionNode,
        messageId: 'proxyMustReturnObject',
      });
      return result;
    }

    if (argument.type === 'ObjectExpression') {
      validateObjectExpressionLayerBroker({ objectNode: argument, context });
    }
  }
  return result;
};
