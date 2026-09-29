/**
 * PURPOSE: Resolves an Identifier reference inside a z.discriminatedUnion variant property to the initializer of its same-file VariableDeclarator binding (top-level Program scope), so the variant predicate can inspect schemas defined as `const fooSchema = z.record(z.string(), ...)` and referenced as `payload: fooSchema`.
 *
 * USAGE:
 * const init = checkResolveSchemaBindingLayerBroker({ identifierNode });
 * // Returns the `init` AST node of the matching Program-level VariableDeclarator, or undefined if not found.
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const checkResolveSchemaBindingLayerBroker = ({
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

  let scope: TSESTree.Node | null | undefined = identifierNode.parent;
  while (scope.type !== AST_NODE_TYPES.BlockStatement && scope.type !== AST_NODE_TYPES.Program) {
    scope = scope.parent;
  }

  const bodyValue = scope.body;
  if (!Array.isArray(bodyValue)) {
    return undefined;
  }

  for (const statement of bodyValue) {
    // Top-level `const x = …;` — VariableDeclaration directly in the body
    // OR top-level `export const x = …;` — wrapped in ExportNamedDeclaration
    // whose `declaration` is the VariableDeclaration.
    const varDecl: TSESTree.Node | undefined =
      statement.type === AST_NODE_TYPES.VariableDeclaration
        ? statement
        : statement.type === AST_NODE_TYPES.ExportNamedDeclaration &&
            statement.declaration?.type === AST_NODE_TYPES.VariableDeclaration
          ? statement.declaration
          : undefined;
    if (!varDecl) continue;

    const { declarations } = varDecl;
    for (const declarator of declarations) {
      const { id, init } = declarator;
      if (id.type === AST_NODE_TYPES.Identifier && id.name === identifierName && init) {
        return init;
      }
    }
  }
  return undefined;
};
