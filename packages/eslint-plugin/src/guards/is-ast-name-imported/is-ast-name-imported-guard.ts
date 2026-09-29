/**
 * PURPOSE: True when a file already binds a name through an import, so a fix that would import it
 * again writes nothing. Reach for this before inserting an import; a second import of one name is a
 * redeclaration.
 *
 * USAGE:
 * isAstNameImportedGuard({ program, name: 'Quest' });
 * // Returns true when any import declaration has a specifier whose local name is Quest
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const isAstNameImportedGuard = ({
  program,
  name,
}: {
  program?: TSESTree.Program;
  name?: string;
}): boolean => {
  if (program === undefined || name === undefined) {
    return false;
  }
  return program.body
    .filter((statement) => statement.type === AST_NODE_TYPES.ImportDeclaration)
    .some((statement) => statement.specifiers.some((specifier) => specifier.local.name === name));
};
