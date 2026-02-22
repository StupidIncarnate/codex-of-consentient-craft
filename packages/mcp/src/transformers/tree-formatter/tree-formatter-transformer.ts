/**
 * PURPOSE: Converts flat file list to tree-style formatted string for compact display
 *
 * USAGE:
 * const tree = treeFormatterTransformer({
 *   items: [
 *     { name: 'guard1', type: 'guard', purpose: 'Checks permission', path: 'src/guards/guard1.ts' }
 *   ]
 * });
 * // Returns: "guards/\n  guard1 (guard) - Checks permission"
 */
import type { TreeItem } from '../../contracts/tree-item/tree-item-contract';
import type { TreeNode } from '../../contracts/tree-node/tree-node-contract';
import { folderNameContract } from '../../contracts/folder-name/folder-name-contract';
import { treeOutputContract } from '../../contracts/tree-output/tree-output-contract';
import type { TreeOutput } from '../../contracts/tree-output/tree-output-contract';
import { formatTreeNodeTransformer } from '../format-tree-node/format-tree-node-transformer';

export const treeFormatterTransformer = ({ items }: { items: readonly TreeItem[] }): TreeOutput => {
  if (items.length === 0) {
    return treeOutputContract.parse('');
  }

  // Build tree structure
  const root: TreeNode = {
    name: folderNameContract.parse(''),
    children: new Map(),
    items: [],
  };

  for (const item of items) {
    // Extract path segments after the last "src/" or use the whole path
    const srcIndex = String(item.path).lastIndexOf('/src/');
    const relevantPath =
      srcIndex >= 0 ? String(item.path).slice(srcIndex + '/src/'.length) : String(item.path);

    // Split into segments
    const segments = relevantPath.split('/').filter(Boolean);

    // Remove filename (last segment)
    const pathSegments = segments.slice(0, -1);

    // Navigate/create tree nodes
    let currentNode = root;
    for (const segment of pathSegments) {
      const folderName = folderNameContract.parse(segment);
      if (!currentNode.children.has(folderName)) {
        currentNode.children.set(folderName, {
          name: folderName,
          children: new Map(),
          items: [],
        });
      }
      const childNode = currentNode.children.get(folderName);
      if (!childNode) {
        throw new Error(`Child node not found for folder: ${folderName}`);
      }
      currentNode = childNode;
    }

    // Add item to leaf node
    currentNode.items.push(item);
  }

  // Format each root folder separately with blank lines between
  const rootFolders = Array.from(root.children.entries())
    .sort(([a], [b]) => String(a).localeCompare(String(b)))
    .map(
      ([folderName, folderNode]) =>
        `${folderName}/\n${formatTreeNodeTransformer({ node: folderNode, indent: 1 })}`,
    );

  return treeOutputContract.parse(rootFolders.join('\n\n'));
};
