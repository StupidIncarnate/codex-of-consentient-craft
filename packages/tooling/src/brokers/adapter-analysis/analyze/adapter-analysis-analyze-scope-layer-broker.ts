/**
 * PURPOSE: Reads the names an adapter's calls can resolve to: what its top-level imports bind
 * (with the module and imported name behind each local name) and every name the file declares
 * itself (parameters, variables, functions, classes). A call whose root is a declared name is a
 * call on a value the adapter holds, not into the outside world.
 *
 * USAGE:
 * adapterAnalysisAnalyzeScopeLayerBroker({ sourceFile, nodes });
 * // Returns { bindings, declared }
 */
import * as ts from '#gateway/npm/typescript';
import { exportNameContract } from '../../../contracts/export-name/export-name-contract';
import { moduleSpecifierContract } from '../../../contracts/module-specifier/module-specifier-contract';
import type { ExportName } from '../../../contracts/export-name/export-name-contract';
import type { OutsideCall } from '../../../contracts/outside-call/outside-call-contract';

export const adapterAnalysisAnalyzeScopeLayerBroker = ({
  sourceFile,
  nodes,
}: {
  sourceFile: ts.SourceFile;
  nodes: readonly ts.Node[];
}): { bindings: Map<ExportName, OutsideCall>; declared: Set<ExportName> } => {
  const bindings = new Map<ExportName, OutsideCall>();
  const declared = new Set<ExportName>();

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
      continue;
    }
    const clause = statement.importClause;
    if (clause === undefined || clause.isTypeOnly) {
      continue;
    }
    const module = moduleSpecifierContract.parse(statement.moduleSpecifier.text);
    if (clause.name !== undefined) {
      bindings.set(exportNameContract.parse(clause.name.text), {
        module,
        name: exportNameContract.parse('default'),
      });
    }
    const named = clause.namedBindings;
    if (named !== undefined && ts.isNamespaceImport(named)) {
      bindings.set(exportNameContract.parse(named.name.text), {
        module,
        name: exportNameContract.parse('*'),
      });
    }
    if (named !== undefined && ts.isNamedImports(named)) {
      for (const element of named.elements.filter((candidate) => !candidate.isTypeOnly)) {
        bindings.set(exportNameContract.parse(element.name.text), {
          module,
          name: exportNameContract.parse((element.propertyName ?? element.name).text),
        });
      }
    }
  }

  for (const node of nodes) {
    const isDeclaration =
      ts.isParameter(node) ||
      ts.isBindingElement(node) ||
      ts.isVariableDeclaration(node) ||
      ts.isFunctionDeclaration(node) ||
      ts.isClassDeclaration(node);
    const name = isDeclaration ? node.name : undefined;
    if (name !== undefined && ts.isIdentifier(name)) {
      declared.add(exportNameContract.parse(name.text));
    }
  }

  return { bindings, declared };
};
