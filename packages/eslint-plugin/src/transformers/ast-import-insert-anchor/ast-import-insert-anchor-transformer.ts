/**
 * PURPOSE: Finds the node a fix inserts a new import after: the last named specifier of an existing
 * import from the same module and of the same kind (the fix then adds `, Name`), else the last import
 * of the file (the fix then adds a whole statement). A file with no import gives null.
 *
 * USAGE:
 * astImportInsertAnchorTransformer({ program, source: '../quest/quest-contract', importKind: 'type' });
 * // Returns the last ImportSpecifier of `import type { … } from '../quest/quest-contract'`, else the last ImportDeclaration
 */
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

export const astImportInsertAnchorTransformer = ({
  program,
  source,
  importKind,
}: {
  program: Tsestree;
  source: string;
  importKind: 'type' | 'value';
}): Tsestree | null => {
  const body = Array.isArray(program.body) ? program.body : [];
  const imports = body.filter((statement) => statement.type === 'ImportDeclaration');

  const lastSpecifier = imports
    .filter(
      (statement) =>
        statement.source?.value === source && (statement.importKind ?? 'value') === importKind,
    )
    .flatMap((statement) =>
      (statement.specifiers ?? []).filter((specifier) => specifier.type === 'ImportSpecifier'),
    )
    .at(-1);

  return lastSpecifier ?? imports.at(-1) ?? null;
};
