/**
 * PURPOSE: Finds a module-level `const` declarator's initializer by name — the shared lookup both
 * of `resolveStaticStringLayerBroker`'s branches need (an Identifier naming a const directly, and a
 * MemberExpression whose object names a const object literal). Its own file, not a private helper
 * inside `resolveStaticStringLayerBroker`, because `forbid-non-exported-functions` requires every
 * function be the primary export of its file.
 *
 * USAGE:
 * findModuleConstInitLayerBroker({ name: 'COMMAND', moduleBody: programBodyStatements });
 * // Returns the const's init node, or undefined when no module-level const has that name
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const findModuleConstInitLayerBroker = ({
  name,
  moduleBody,
}: {
  name: string;
  moduleBody: readonly TSESTree.ProgramStatement[];
}): TSESTree.Node | undefined => {
  for (const statement of moduleBody) {
    if (statement.type !== AST_NODE_TYPES.VariableDeclaration || statement.kind !== 'const') {
      continue;
    }
    for (const declarator of statement.declarations) {
      if (declarator.id.type === AST_NODE_TYPES.Identifier && declarator.id.name === name) {
        return declarator.init ?? undefined;
      }
    }
  }
  return undefined;
};
