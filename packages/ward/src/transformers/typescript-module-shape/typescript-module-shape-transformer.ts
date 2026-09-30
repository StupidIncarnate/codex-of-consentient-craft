/**
 * PURPOSE: Parses one TypeScript source file's top-level statements into the shape the
 * platform-crossing walk needs: every dependency edge (an `import` or a re-export `from`), and
 * every name the file exports on its own. Reach for this over spawning `tsc`: the walk parses one
 * file at a time and never needs a whole-program type-check, only the syntax tree.
 *
 * USAGE:
 * typescriptModuleShapeTransformer({sourceText: FileContentsStub({value: "export * from './x';"}), fileName: 'a.ts'});
 * // Returns: { dependencies: [{specifier: './x', kind: 'star', importedNames: []}], localExportNames: [] }
 */

import * as ts from '#gateway/npm/typescript';

import {
  typescriptModuleShapeContract,
  type TypescriptModuleShape,
} from '../../contracts/typescript-module-shape/typescript-module-shape-contract';
import type { ModuleDependency } from '../../contracts/module-dependency/module-dependency-contract';
import { importDependencyFromDeclarationLayerTransformer } from './import-dependency-from-declaration-layer-transformer';
import { exportDependencyFromDeclarationLayerTransformer } from './export-dependency-from-declaration-layer-transformer';
import { localExportNamesFromStatementLayerTransformer } from './local-export-names-from-statement-layer-transformer';

export const typescriptModuleShapeTransformer = ({
  sourceText,
  fileName,
}: {
  sourceText: string;
  fileName: string;
}): TypescriptModuleShape => {
  const sourceFile = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.ES2022,
    true,
    fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  const dependencies: ModuleDependency[] = [];
  const localExportNames: string[] = [];

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      const dependency = importDependencyFromDeclarationLayerTransformer({ node: statement });
      if (dependency !== undefined) {
        dependencies.push(dependency);
      }
      continue;
    }

    if (ts.isExportDeclaration(statement) && statement.moduleSpecifier !== undefined) {
      const dependency = exportDependencyFromDeclarationLayerTransformer({ node: statement });
      if (dependency !== undefined) {
        dependencies.push(dependency);
      }
      continue;
    }

    localExportNames.push(...localExportNamesFromStatementLayerTransformer({ node: statement }));
  }

  return typescriptModuleShapeContract.parse({ dependencies, localExportNames });
};
