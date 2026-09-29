/**
 * PURPOSE: Determines if a .catch() handler body is silent (no logging, re-throw, or meaningful action)
 *
 * USAGE:
 * const silent = isSilentBodyLayerBroker({ body: handlerNode.body });
 * // Returns true if the body is empty, returns undefined, or has no meaningful statements
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { hasMeaningfulStatementLayerBroker } from './has-meaningful-statement-layer-broker';

export const isSilentBodyLayerBroker = ({
  body,
}: {
  body: TSESTree.Node | undefined | null;
}): boolean => {
  if (!body) {
    return true;
  }

  // Expression body (arrow without braces): () => undefined
  if (body.type !== AST_NODE_TYPES.BlockStatement) {
    // () => undefined
    if (body.type === AST_NODE_TYPES.Identifier && body.name === 'undefined') {
      return true;
    }

    // () => void 0
    if (
      body.type === AST_NODE_TYPES.UnaryExpression &&
      body.argument.type === AST_NODE_TYPES.Literal &&
      body.argument.value === 0
    ) {
      return true;
    }

    // Any other expression (function call, literal value, etc.) is meaningful
    return false;
  }

  // Block body: check statements
  const statements: TSESTree.Node[] | undefined = Array.isArray(body.body) ? body.body : undefined;

  // Empty block: () => {}
  if (!statements || statements.length === 0) {
    return true;
  }

  // Check if any statement is meaningful
  return !hasMeaningfulStatementLayerBroker({ statements });
};
