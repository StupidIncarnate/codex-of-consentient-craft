/**
 * PURPOSE: Formats a tree node into indented text representation. Grep hits come in already
 * capped, keyed by the item they belong to — this file renders what it is handed and decides
 * nothing about how much of a file to show, because the budget behind that decision spans the
 * whole tree and no single node can see it.
 *
 * USAGE:
 * const output = formatTreeNodeTransformer({
 *   node: { name: 'guards', children: new Map(), items: [item1, item2] },
 *   indent: 0,
 *   hitRenders: new Map()
 * });
 * // Returns formatted string with proper indentation
 */
import type { CappedGrepHits } from '../../contracts/capped-grep-hits/capped-grep-hits-contract';
import type { TreeItem } from '../../contracts/tree-item/tree-item-contract';
import type { TreeNode } from '../../contracts/tree-node/tree-node-contract';

export const formatTreeNodeTransformer = ({
  node,
  indent,
  hitRenders,
}: {
  node: TreeNode;
  indent: number;
  hitRenders: ReadonlyMap<TreeItem, CappedGrepHits>;
}): string => {
  const lines: string[] = [];
  const indentStr = '  '.repeat(indent);

  // Sort children and items alphabetically
  const sortedChildren = Array.from(node.children.entries()).sort(([a], [b]) => a.localeCompare(b));
  const sortedItems = [...node.items].sort((a, b) => String(a.name).localeCompare(String(b.name)));

  // Render children (folders)
  for (const [childName, childNode] of sortedChildren) {
    lines.push(`${indentStr}${childName}/`);
    lines.push(formatTreeNodeTransformer({ node: childNode, indent: indent + 1, hitRenders }));
  }

  // Render items (files)
  for (const item of sortedItems) {
    const typePart = item.type && String(item.type) !== 'unknown' ? ` (${item.type})` : '';
    const purposePart = item.purpose ? ` - ${item.purpose}` : '';
    const render = hitRenders.get(item);
    const labelSuffix = render === undefined ? '' : render.labelSuffix;

    lines.push(`${indentStr}${item.name}${typePart}${purposePart}${labelSuffix}`);

    for (const hitLine of render?.lines ?? []) {
      lines.push(`${indentStr}  ${hitLine}`);
    }
  }

  return lines.join('\n');
};
