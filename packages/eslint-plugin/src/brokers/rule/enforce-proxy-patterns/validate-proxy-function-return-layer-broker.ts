/**
 * PURPOSE: Layer helper that validates proxy functions return objects rather than primitives, void, or arrays
 *
 * USAGE:
 * validateProxyFunctionReturnLayerBroker({ functionNode, context });
 * // Reports error if proxy function returns void, string, number, boolean, or array instead of object
 */
import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { validateReturnStatementLayerBroker } from './validate-return-statement-layer-broker';
import { validateObjectExpressionLayerBroker } from './validate-object-expression-layer-broker';

export const validateProxyFunctionReturnLayerBroker = ({
  functionNode,
  context,
}: {
  functionNode: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression;
  context: TSESLint.RuleContext<string, unknown[]>;
}): AdapterResult => {
  const result = adapterResultContract.parse({ success: true });
  const { returnType, body } = functionNode;

  // Check explicit return type annotation if present
  if (returnType) {
    const { type: typeAnnotationType } = returnType.typeAnnotation;

    // Check if return type is void, primitive, or array
    if (
      typeAnnotationType === AST_NODE_TYPES.TSVoidKeyword ||
      typeAnnotationType === AST_NODE_TYPES.TSStringKeyword ||
      typeAnnotationType === AST_NODE_TYPES.TSNumberKeyword ||
      typeAnnotationType === AST_NODE_TYPES.TSBooleanKeyword ||
      typeAnnotationType === AST_NODE_TYPES.TSArrayType ||
      typeAnnotationType === AST_NODE_TYPES.TSTupleType
    ) {
      context.report({
        node: functionNode,
        messageId: 'proxyMustReturnObject',
      });
      return result;
    }
  }

  if (body.type === AST_NODE_TYPES.BlockStatement) {
    // Block statement has statements in its body array
    let hasReturnStatement = false;

    for (const statement of body.body) {
      if (statement.type === AST_NODE_TYPES.ReturnStatement) {
        hasReturnStatement = true;
        validateReturnStatementLayerBroker({ statement, context, functionNode });
      }
    }

    // If no return statement found in block, it's an implicit void return
    if (!hasReturnStatement) {
      context.report({
        node: functionNode,
        messageId: 'proxyMustReturnObject',
      });
    }
  } else if (body.type === AST_NODE_TYPES.ObjectExpression) {
    // Arrow function with direct object return: () => ({ ... })
    validateObjectExpressionLayerBroker({ objectNode: body, context });
  } else if (
    // Direct return of primitives or arrays: () => 'string', () => 42, () => []
    // Check if it's returning non-object
    body.type === AST_NODE_TYPES.Literal ||
    body.type === AST_NODE_TYPES.TemplateLiteral ||
    body.type === AST_NODE_TYPES.ArrayExpression ||
    body.type === AST_NODE_TYPES.Identifier
  ) {
    context.report({
      node: functionNode,
      messageId: 'proxyMustReturnObject',
    });
  }
  return result;
};
