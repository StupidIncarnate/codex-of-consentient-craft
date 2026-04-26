/**
 * PURPOSE: Walks back from an Identifier reference to find the initializer of its enclosing-block VariableDeclarator
 *
 * USAGE:
 * const init = checkBindingInitializerLayerBroker({ identifierNode });
 * // Returns the `init` AST node of the same-block VariableDeclarator binding the identifier, or undefined
 */
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';

export const checkBindingInitializerLayerBroker = ({
  identifierNode,
}: {
  identifierNode?: Tsestree;
}): Tsestree | undefined => {
  if (!identifierNode || identifierNode.type !== 'Identifier' || !identifierNode.name) {
    return undefined;
  }

  const identifierName = String(identifierNode.name);

  let block: Tsestree | null | undefined = identifierNode.parent;
  while (block && block.type !== 'BlockStatement' && block.type !== 'Program') {
    block = block.parent;
  }
  if (!block) {
    return undefined;
  }

  const bodyValue = block.body;
  if (!Array.isArray(bodyValue)) {
    return undefined;
  }

  for (const statement of bodyValue) {
    if (statement.type !== 'VariableDeclaration') {
      continue;
    }
    const declarations = statement.declarations ?? [];
    for (const declarator of declarations) {
      if (declarator.type !== 'VariableDeclarator') {
        continue;
      }
      const { id, init } = declarator;
      if (id && id.type === 'Identifier' && id.name === identifierName && init) {
        return init;
      }
    }
  }
  return undefined;
};
