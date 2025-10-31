/**
 * PURPOSE: Layer helper that validates proxy functions return objects rather than primitives, void, or arrays
 *
 * USAGE:
 * validateProxyFunctionReturnLayerBroker({ functionNode, context });
 * // Reports error if proxy function returns void, string, number, boolean, or array instead of object
 */
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { validateReturnStatementLayerBroker } from './validate-return-statement-layer-broker';
import { validateObjectExpressionLayerBroker } from './validate-object-expression-layer-broker';

export const validateProxyFunctionReturnLayerBroker = ({
  functionNode,
  context,
}: {
  functionNode: Tsestree;
  context: EslintContext;
}): void => {
  const { body, returnType } = functionNode;

  if (!body) return;

  // Check explicit return type annotation if present
  if (returnType) {
    const { typeAnnotation } = returnType;
    if (typeAnnotation) {
      const typeAnnotationType = typeAnnotation.type;

      // Check if return type is void, primitive, or array
      if (
        typeAnnotationType === 'TSVoidKeyword' ||
        typeAnnotationType === 'TSStringKeyword' ||
        typeAnnotationType === 'TSNumberKeyword' ||
        typeAnnotationType === 'TSBooleanKeyword' ||
        typeAnnotationType === 'TSArrayType' ||
        typeAnnotationType === 'TSTupleType'
      ) {
        context.report({
          node: functionNode,
          messageId: 'proxyMustReturnObject',
        });
        return;
      }
    }
  }

  // Check function body - handle union type (body can be single node or array)
  if (Array.isArray(body)) {
    // Body is an array (shouldn't happen for function bodies, but handle it)
    return;
  }

  if (body.type === 'BlockStatement') {
    // Block statement has statements in its body array
    if (body.body && Array.isArray(body.body)) {
      const statements = body.body;
      let hasReturnStatement = false;

      for (const statement of statements) {
        if (statement.type === 'ReturnStatement') {
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
    }
  } else if (body.type === 'ObjectExpression') {
    // Arrow function with direct object return: () => ({ ... })
    validateObjectExpressionLayerBroker({ objectNode: body, context });
  } else if (
    // Direct return of primitives or arrays: () => 'string', () => 42, () => []
    // Check if it's returning non-object
    body.type === 'Literal' ||
    body.type === 'TemplateLiteral' ||
    body.type === 'ArrayExpression' ||
    body.type === 'Identifier'
  ) {
    context.report({
      node: functionNode,
      messageId: 'proxyMustReturnObject',
    });
  }
};
