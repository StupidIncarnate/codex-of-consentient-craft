/**
 * PURPOSE: Layer helper that validates return statements in proxy functions return valid objects
 *
 * USAGE:
 * validateReturnStatementLayerBroker({ statement, context, functionNode });
 * // Reports error if return statement returns void, primitive, or array instead of object
 */
import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { validateObjectExpressionLayerBroker } from './validate-object-expression-layer-broker';

export const validateReturnStatementLayerBroker = ({
  statement,
  context,
  functionNode,
}: {
  statement: TSESTree.Node;
  context: TSESLint.RuleContext<string, unknown[]>;
  functionNode: TSESTree.Node;
}): AdapterResult => {
  const result = adapterResultContract.parse({ success: true });
  if (statement.type === AST_NODE_TYPES.ReturnStatement) {
    const { argument } = statement;

    if (!argument) {
      context.report({
        node: functionNode,
        messageId: 'proxyMustReturnObject',
      });
      return result;
    }

    if (
      argument.type === AST_NODE_TYPES.Literal ||
      argument.type === AST_NODE_TYPES.TemplateLiteral ||
      argument.type === AST_NODE_TYPES.ArrayExpression ||
      argument.type === AST_NODE_TYPES.Identifier
    ) {
      context.report({
        node: functionNode,
        messageId: 'proxyMustReturnObject',
      });
      return result;
    }

    if (argument.type === AST_NODE_TYPES.ObjectExpression) {
      validateObjectExpressionLayerBroker({ objectNode: argument, context });
    }
  }
  return result;
};
