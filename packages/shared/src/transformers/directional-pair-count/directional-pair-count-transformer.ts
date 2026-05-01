/**
 * PURPOSE: Counts how many times each directional pair string appears in an input list,
 * preserving first-seen order and returning the unique pairs with their counts as ContentText.
 *
 * USAGE:
 * directionalPairCountTransformer({
 *   pairs: [
 *     contentTextContract.parse('orchestrator → web'),
 *     contentTextContract.parse('orchestrator → web'),
 *     contentTextContract.parse('server → web'),
 *   ],
 * });
 * // Returns [{ pair: 'orchestrator → web', count: '2' }, { pair: 'server → web', count: '1' }]
 *
 * WHEN-TO-USE: EDGES footer builder summarising WS/file-bus edges by package-pair direction
 */

import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';

export const directionalPairCountTransformer = ({
  pairs,
}: {
  pairs: ContentText[];
}): { pair: ContentText; count: ContentText }[] => {
  const order: ContentText[] = [];
  const counts: ContentText[] = [];
  for (const pair of pairs) {
    let foundIdx = -1;
    for (let i = 0; i < order.length; i += 1) {
      const existing = order[i];
      if (existing !== undefined && String(existing) === String(pair)) {
        foundIdx = i;
        break;
      }
    }
    if (foundIdx === -1) {
      order.push(pair);
      counts.push(contentTextContract.parse('1'));
    } else {
      const current = counts[foundIdx];
      const currentNum = current === undefined ? 0 : Number(String(current));
      counts[foundIdx] = contentTextContract.parse(String(currentNum + 1));
    }
  }
  return order.map((pair, i) => {
    const count = counts[i] ?? contentTextContract.parse('0');
    return { pair, count };
  });
};
