/**
 * PURPOSE: Reads a parent contract's source and says where a layer contract is used: the parent's
 * const, then each property key between it and the layer. A layer is the parent's own nested object
 * moved to another file, so this path is what the layer's brand texts derive from. Reach for it when
 * the layer's file is linted and only the parent's text is at hand. Null when the layer appears only
 * in an import, or not at all.
 *
 * USAGE:
 * astLayerParentUseTransformer({ source: questContractText, layerName: 'ownerLayerContract' });
 * // Returns ['questContract', 'owner'] for `owner: ownerLayerContract` inside `questContract`
 */
import * as ts from '#gateway/npm/typescript';

export const astLayerParentUseTransformer = ({
  source,
  layerName,
}: {
  source: string;
  layerName: string;
}): string[] | null => {
  const file = ts.createSourceFile(
    'parent-contract.ts',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const uses: { pos: number; path: string[] }[] = [];
  const pending: { node: ts.Node; path: string[] }[] = [{ node: file, path: [] }];

  for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
    const { node, path } = next;
    if (ts.isImportDeclaration(node)) {
      continue;
    }
    if (ts.isIdentifier(node) && node.text === layerName && path.length > 0) {
      uses.push({ pos: node.getStart(file), path });
    }

    const childPath =
      ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)
        ? [node.name.text]
        : ts.isPropertyAssignment(node) &&
            path.length > 0 &&
            (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name))
          ? [...path, node.name.text]
          : path;
    ts.forEachChild(node, (child) => {
      pending.push({ node: child, path: childPath });
    });
  }

  const [first] = uses.sort((left, right) => left.pos - right.pos);

  return first?.path ?? null;
};
