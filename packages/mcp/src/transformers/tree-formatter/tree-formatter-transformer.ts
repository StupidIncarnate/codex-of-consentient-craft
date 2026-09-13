/**
 * PURPOSE: Converts flat file list to tree-style formatted string for compact display, and owns
 * the one budget that bounds a grep result as a whole. Reach for this over calling
 * `formatTreeNodeTransformer` directly: that renders a subtree and can see only its own node,
 * while the byte budget is spent across every file in the result.
 *
 * USAGE:
 * const tree = treeFormatterTransformer({
 *   items: [
 *     { name: 'guard1', type: 'guard', purpose: 'Checks permission', path: 'src/guards/guard1.ts' }
 *   ]
 * });
 * // Returns: "guards/\n  guard1 (guard) - Checks permission"
 */
import type { CappedGrepHits } from '../../contracts/capped-grep-hits/capped-grep-hits-contract';
import type { TreeItem } from '../../contracts/tree-item/tree-item-contract';
import type { TreeNode } from '../../contracts/tree-node/tree-node-contract';
import { pathSegmentContract } from '@dungeonmaster/shared/contracts';
import { folderNameContract } from '../../contracts/folder-name/folder-name-contract';
import { treeOutputContract } from '../../contracts/tree-output/tree-output-contract';
import type { TreeOutput } from '../../contracts/tree-output/tree-output-contract';
import { formatTreeNodeTransformer } from '../format-tree-node/format-tree-node-transformer';
import { grepHitsCapTransformer } from '../grep-hits-cap/grep-hits-cap-transformer';
import { pathToTreeRelativeTransformer } from '../path-to-tree-relative/path-to-tree-relative-transformer';
import { discoverOutputCapStatics } from '../../statics/discover-output-cap/discover-output-cap-statics';

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
    const relevantPath = pathToTreeRelativeTransformer({
      filepath: pathSegmentContract.parse(String(item.path)),
    });

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

  // Spend the line budget in the order the scan produced, so what runs out is line CONTENT and
  // never a file: every matching file keeps its label and its count whatever is left, which is
  // what a rename sweep needs from this output.
  const hitRenders = new Map<TreeItem, CappedGrepHits>();
  let spentOnLines = 0;

  for (const item of items) {
    if (item.hits !== undefined && item.hits.length > 0) {
      const render = grepHitsCapTransformer({
        hits: item.hits,
        budgetRemaining: discoverOutputCapStatics.grepOutput.lineBudgetChars - spentOnLines,
      });
      hitRenders.set(item, render);
      spentOnLines += render.lines.reduce((total, line) => total + line.length + 1, 0);
    }
  }

  // Format each root folder separately with blank lines between
  const rootFolders = Array.from(root.children.entries())
    .sort(([a], [b]) => String(a).localeCompare(String(b)))
    .map(
      ([folderName, folderNode]) =>
        `${folderName}/\n${formatTreeNodeTransformer({ node: folderNode, indent: 1, hitRenders })}`,
    );

  return treeOutputContract.parse(rootFolders.join('\n\n'));
};
