/**
 * PURPOSE: Formats a tree node into indented text representation
 *
 * USAGE:
 * const output = formatTreeNodeTransformer({
 *   node: { name: 'guards', children: new Map(), items: [item1, item2] },
 *   indent: 0
 * });
 * // Returns formatted string with proper indentation
 */
import type { TreeNode } from '../../contracts/tree-node/tree-node-contract';
import { treeOutputContract } from '../../contracts/tree-output/tree-output-contract';
import type { TreeOutput } from '../../contracts/tree-output/tree-output-contract';

export const formatTreeNodeTransformer = ({
  node,
  indent,
}: {
  node: TreeNode;
  indent: number;
}): TreeOutput => {
  const lines: TreeOutput[] = [];
  const indentStr = '  '.repeat(indent);

  // Sort children and items alphabetically
  const sortedChildren = Array.from(node.children.entries()).sort(([a], [b]) =>
    String(a).localeCompare(String(b)),
  );
  const sortedItems = [...node.items].sort((a, b) => String(a.name).localeCompare(String(b.name)));

  // Render children (folders)
  for (const [childName, childNode] of sortedChildren) {
    lines.push(treeOutputContract.parse(`${indentStr}${childName}/`));
    lines.push(formatTreeNodeTransformer({ node: childNode, indent: indent + 1 }));
  }

  // Render items (files)
  for (const item of sortedItems) {
    const typePart = item.type && String(item.type) !== 'unknown' ? ` (${item.type})` : '';
    const purposePart = item.purpose ? ` - ${item.purpose}` : '';
    lines.push(treeOutputContract.parse(`${indentStr}${item.name}${typePart}${purposePart}`));

    // Render grep hits indented below the item
    if (item.hits?.length) {
      for (const hit of item.hits) {
        lines.push(treeOutputContract.parse(`${indentStr}  :${hit.line}  ${hit.text}`));
      }
    }
  }

  return treeOutputContract.parse(lines.join('\n'));
};
