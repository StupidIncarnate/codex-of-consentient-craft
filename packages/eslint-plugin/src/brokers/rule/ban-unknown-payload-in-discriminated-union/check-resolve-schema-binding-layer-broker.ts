/**
 * PURPOSE: Resolves an Identifier reference inside a z.discriminatedUnion variant property to the initializer of its same-file VariableDeclarator binding (top-level Program scope), so the variant predicate can inspect schemas defined as `const fooSchema = z.record(...)` and referenced as `payload: fooSchema`.
 *
 * USAGE:
 * const init = checkResolveSchemaBindingLayerBroker({ identifierNode });
 * // Returns the `init` AST node of the matching Program-level VariableDeclarator, or undefined if not found.
 */
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';

export const checkResolveSchemaBindingLayerBroker = ({
  identifierNode,
}: {
  identifierNode?: Tsestree;
}): Tsestree | undefined => {
  if (!identifierNode || identifierNode.type !== 'Identifier' || !identifierNode.name) {
    return undefined;
  }

  const identifierName = String(identifierNode.name);

  let scope: Tsestree | null | undefined = identifierNode.parent;
  while (scope && scope.type !== 'BlockStatement' && scope.type !== 'Program') {
    scope = scope.parent;
  }
  if (!scope) {
    return undefined;
  }

  const bodyValue = scope.body;
  if (!Array.isArray(bodyValue)) {
    return undefined;
  }

  for (const statement of bodyValue) {
    // Top-level `const x = …;` — VariableDeclaration directly in the body
    // OR top-level `export const x = …;` — wrapped in ExportNamedDeclaration
    // whose `declaration` is the VariableDeclaration.
    const varDecl: Tsestree | undefined =
      statement.type === 'VariableDeclaration'
        ? statement
        : statement.type === 'ExportNamedDeclaration' &&
            statement.declaration?.type === 'VariableDeclaration'
          ? statement.declaration
          : undefined;
    if (!varDecl) continue;

    const declarations = varDecl.declarations ?? [];
    for (const declarator of declarations) {
      if (declarator.type !== 'VariableDeclarator') continue;
      const { id, init } = declarator;
      if (id && id.type === 'Identifier' && id.name === identifierName && init) {
        return init;
      }
    }
  }
  return undefined;
};
