/**
 * PURPOSE: Lists the variable declarators written at the top level of a file, the exported ones
 * or only the local ones. A contract file's owners are its top-level consts, and its local ones are
 * where a self-referencing contract keeps its field list and an owner that points at itself keeps
 * its id.
 *
 * USAGE:
 * astProgramDeclaratorsTransformer({ program: programNode, localOnly: true });
 * // Returns the declarators of `const questFields = z.object({ … })`, not of `export const …`
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const astProgramDeclaratorsTransformer = ({
  program,
  localOnly,
}: {
  program: TSESTree.Program;
  localOnly: boolean;
}): TSESTree.VariableDeclarator[] =>
  program.body.flatMap((statement) => {
    const isExported = statement.type === AST_NODE_TYPES.ExportNamedDeclaration;
    if (localOnly && isExported) {
      return [];
    }

    const declaration = isExported ? statement.declaration : statement;

    return declaration?.type === AST_NODE_TYPES.VariableDeclaration ? declaration.declarations : [];
  });
