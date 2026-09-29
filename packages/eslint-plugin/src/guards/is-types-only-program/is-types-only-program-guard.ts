/**
 * PURPOSE: Tells whether a Program node exports types and nothing else: at least one `export type X` or `export interface X` declaration, and no value export, default export or `export *`. Imports and unexported local declarations do not count against it.
 *
 * USAGE:
 * isTypesOnlyProgramGuard({ node: programNode });
 * // Returns true for `export type OnLine = (line: string) => void;`
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const isTypesOnlyProgramGuard = ({ node }: { node?: TSESTree.Program }): boolean => {
  if (!node) {
    return false;
  }

  let hasTypeDeclaration = false;

  for (const statement of node.body) {
    if (
      statement.type === AST_NODE_TYPES.ExportDefaultDeclaration ||
      statement.type === AST_NODE_TYPES.ExportAllDeclaration
    ) {
      return false;
    }

    if (statement.type === AST_NODE_TYPES.ExportNamedDeclaration) {
      const { declaration } = statement;

      if (
        declaration?.type === AST_NODE_TYPES.TSTypeAliasDeclaration ||
        declaration?.type === AST_NODE_TYPES.TSInterfaceDeclaration
      ) {
        hasTypeDeclaration = true;
      } else if (statement.exportKind !== 'type') {
        return false;
      }
    }
  }

  return hasTypeDeclaration;
};
