/**
 * PURPOSE: Finds the catch-all staging sites in a proxy: `calledWith([])` and `onceFor([])` (an empty
 * address answers every call), an accept-all predicate (`() => true`) in the address, and
 * `callsMatching([])` (reads back every call). A site is recorded by line so a migration can go
 * straight to it.
 *
 * USAGE:
 * sourceFactsExtractStagingLayerBroker({ sourceFile });
 * // Returns [{ line: 12, kind: 'empty-address', snippet: 'handle.calledWith([])' }]
 */
import * as ts from '#gateway/npm/typescript';
import { catchAllSiteContract } from '../../../contracts/catch-all-site/catch-all-site-contract';
import { codeSnippetNormalizeTransformer } from '../../../transformers/code-snippet-normalize/code-snippet-normalize-transformer';
import { censusLayoutStatics } from '../../../statics/census-layout/census-layout-statics';
import type { SourceFacts } from '../../../contracts/source-facts/source-facts-contract';

export const sourceFactsExtractStagingLayerBroker = ({
  sourceFile,
}: {
  sourceFile: ts.SourceFile;
}): SourceFacts['catchAllSites'] => {
  const sites: SourceFacts['catchAllSites'] = [];
  const stagingMethods = [
    ...censusLayoutStatics.staging.addressMethods,
    censusLayoutStatics.staging.readBackMethod,
  ];
  const pending: ts.Node[] = [sourceFile];

  while (pending.length > 0) {
    const node = pending.pop();
    if (node === undefined) {
      continue;
    }
    ts.forEachChild(node, (child) => {
      pending.push(child);
    });

    if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)) {
      continue;
    }
    const method = node.expression.name.text;
    const [address] = node.arguments;
    if (
      !stagingMethods.some((candidate) => candidate === method) ||
      address === undefined ||
      !ts.isArrayLiteralExpression(address)
    ) {
      continue;
    }

    const acceptsAll = address.elements.some((element) => {
      if (!ts.isArrowFunction(element) && !ts.isFunctionExpression(element)) {
        return false;
      }
      if (element.body.kind === ts.SyntaxKind.TrueKeyword) {
        return true;
      }
      const [only] = ts.isBlock(element.body) ? element.body.statements : [];
      return (
        only !== undefined &&
        ts.isReturnStatement(only) &&
        only.expression?.kind === ts.SyntaxKind.TrueKeyword
      );
    });
    if (address.elements.length > 0 && !acceptsAll) {
      continue;
    }

    const isReadBack = method === censusLayoutStatics.staging.readBackMethod;
    const emptyKind = isReadBack ? 'read-all' : 'empty-address';
    sites.push(
      catchAllSiteContract.parse({
        line: sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1,
        kind: address.elements.length === 0 ? emptyKind : 'accept-all-predicate',
        snippet: codeSnippetNormalizeTransformer({ text: node.getText(sourceFile) }),
      }),
    );
  }

  return sites.sort((a, b) => a.line - b.line);
};
