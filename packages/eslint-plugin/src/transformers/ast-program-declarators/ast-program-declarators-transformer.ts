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
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

export const astProgramDeclaratorsTransformer = ({
  program,
  localOnly,
}: {
  program: Tsestree;
  localOnly: boolean;
}): Tsestree[] =>
  (Array.isArray(program.body) ? program.body : []).flatMap((statement) => {
    const isExported = statement.type === 'ExportNamedDeclaration';
    if (localOnly && isExported) {
      return [];
    }

    const declaration = isExported ? statement.declaration : statement;

    return declaration?.type === 'VariableDeclaration' ? (declaration.declarations ?? []) : [];
  });
