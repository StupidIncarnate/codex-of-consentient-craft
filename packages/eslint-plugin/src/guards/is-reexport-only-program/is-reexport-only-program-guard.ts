/**
 * PURPOSE: Tells whether a Program node holds only `export ... from` statements, the one shape a package barrel may take. A file with any declaration, import, local export or default export is an implementation file, whatever it is named.
 *
 * USAGE:
 * isReexportOnlyProgramGuard({ node: programNode });
 * // Returns true for `export * from './a'; export type { B } from './b';`
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const isReexportOnlyProgramGuard = ({ node }: { node?: TSESTree.Program }): boolean => {
  if (!node) {
    return false;
  }

  return node.body.every((statement) => {
    if (statement.type === AST_NODE_TYPES.ExportAllDeclaration) {
      return true;
    }

    return (
      statement.type === AST_NODE_TYPES.ExportNamedDeclaration &&
      !statement.declaration &&
      Boolean(statement.source)
    );
  });
};
