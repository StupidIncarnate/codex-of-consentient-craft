/**
 * PURPOSE: Walks back from an Identifier reference to find the initializer of its enclosing-block VariableDeclarator
 *
 * USAGE:
 * const init = checkBindingInitializerLayerBroker({ identifierNode });
 * // Returns the `init` AST node of the same-block VariableDeclarator binding the identifier, or undefined
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const checkBindingInitializerLayerBroker = ({
  identifierNode,
}: {
  identifierNode?: TSESTree.Node;
}): TSESTree.Node | undefined => {
  if (
    !identifierNode ||
    identifierNode.type !== AST_NODE_TYPES.Identifier ||
    !identifierNode.name
  ) {
    return undefined;
  }

  const identifierName = identifierNode.name;

  let block: TSESTree.Node | null | undefined = identifierNode.parent;
  while (block.type !== AST_NODE_TYPES.BlockStatement && block.type !== AST_NODE_TYPES.Program) {
    block = block.parent;
  }

  const bodyValue = block.body;
  if (!Array.isArray(bodyValue)) {
    return undefined;
  }

  for (const statement of bodyValue) {
    if (statement.type !== AST_NODE_TYPES.VariableDeclaration) {
      continue;
    }
    const { declarations } = statement;
    for (const declarator of declarations) {
      const { id, init } = declarator;
      if (id.type === AST_NODE_TYPES.Identifier && id.name === identifierName && init) {
        return init;
      }
    }
  }
  return undefined;
};
