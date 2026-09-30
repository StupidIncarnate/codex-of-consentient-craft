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
import { adapterAnalysisAnalyzeScopeLayerResultContract } from '../../../contracts/adapter-analysis-analyze-scope-layer-result/adapter-analysis-analyze-scope-layer-result-contract';
import type { AdapterAnalysisAnalyzeScopeLayerResult } from '../../../contracts/adapter-analysis-analyze-scope-layer-result/adapter-analysis-analyze-scope-layer-result-contract';
import * as ts from '#gateway/npm/typescript';
import type { OutsideCall } from '../../../contracts/outside-call/outside-call-contract';
import { outsideCallContract } from '../../../contracts/outside-call/outside-call-contract';

export const adapterAnalysisAnalyzeScopeLayerBroker = ({
  sourceFile,
  nodes,
}: {
  sourceFile: ts.SourceFile;
  nodes: readonly ts.Node[];
}): AdapterAnalysisAnalyzeScopeLayerResult => {
  const bindings = new Map<string, OutsideCall>();
  const declared = new Set<string>();

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
      continue;
    }
    const clause = statement.importClause;
    if (clause === undefined || clause.isTypeOnly) {
      continue;
    }
    const module = statement.moduleSpecifier.text;
    if (clause.name !== undefined) {
      bindings.set(
        clause.name.text,
        outsideCallContract.parse({
          module,
          name: 'default',
        }),
      );
    }
    const named = clause.namedBindings;
    if (named !== undefined && ts.isNamespaceImport(named)) {
      bindings.set(
        named.name.text,
        outsideCallContract.parse({
          module,
          name: '*',
        }),
      );
    }
    if (named !== undefined && ts.isNamedImports(named)) {
      for (const element of named.elements.filter((candidate) => !candidate.isTypeOnly)) {
        bindings.set(
          element.name.text,
          outsideCallContract.parse({
            module,
            name: (element.propertyName ?? element.name).text,
          }),
        );
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
      declared.add(name.text);
    }
  }

  return adapterAnalysisAnalyzeScopeLayerResultContract.parse({ bindings, declared });
};
