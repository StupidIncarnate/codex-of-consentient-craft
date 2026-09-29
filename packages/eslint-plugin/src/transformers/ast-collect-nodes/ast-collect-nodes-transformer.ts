/**
 * PURPOSE: Collects every descendant of one node that has a given type, at any depth. Never follows
 * `parent`, so a walk over a real ESLint tree ends. Reach for this over a visitor when a rule must
 * answer a question about a whole declaration before it reports on any single node of it.
 *
 * USAGE:
 * astCollectNodesTransformer({ node: declarator, type: 'SpreadElement' });
 * // Returns every `...x` spread inside the declarator
 */
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

export const astCollectNodesTransformer = ({
  node,
  type,
}: {
  node: Tsestree;
  type: Tsestree['type'];
}): Tsestree[] => {
  const values: unknown[] = Object.entries(node)
    .filter(([key]) => key !== 'parent')
    .flatMap(([, value]) => (Array.isArray(value) ? value : [value]));

  return values.flatMap((child) => {
    if (typeof child !== 'object' || child === null || !('type' in child)) {
      return [];
    }
    if (typeof child.type !== 'string') {
      return [];
    }

    // A value with a string `type` is a node: ESLint hands nothing else that shape.
    const found = child as Tsestree;

    return [
      ...(found.type === type ? [found] : []),
      ...astCollectNodesTransformer({ node: found, type }),
    ];
  });
};
