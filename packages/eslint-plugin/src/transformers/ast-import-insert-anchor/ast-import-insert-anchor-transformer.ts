/**
 * PURPOSE: Finds the node a fix inserts a new import after: the last named specifier of an existing
 * import from the same module and of the same kind (the fix then adds `, Name`), else the last import
 * of the file (the fix then adds a whole statement). A file with no import gives null.
 *
 * USAGE:
 * astImportInsertAnchorTransformer({ program, source: '../quest/quest-contract', importKind: 'type' });
 * // Returns the last ImportSpecifier of `import type { … } from '../quest/quest-contract'`, else the last ImportDeclaration
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const astImportInsertAnchorTransformer = ({
  program,
  source,
  importKind,
}: {
  program: TSESTree.Program;
  source: string;
  importKind: 'type' | 'value';
}): TSESTree.ImportDeclaration | TSESTree.ImportSpecifier | null => {
  const imports = program.body.filter(
    (statement) => statement.type === AST_NODE_TYPES.ImportDeclaration,
  );

  const lastSpecifier = imports
    .filter((statement) => statement.source.value === source && statement.importKind === importKind)
    .flatMap((statement) =>
      statement.specifiers.filter((specifier) => specifier.type === AST_NODE_TYPES.ImportSpecifier),
    )
    .at(-1);

  return lastSpecifier ?? imports.at(-1) ?? null;
};
