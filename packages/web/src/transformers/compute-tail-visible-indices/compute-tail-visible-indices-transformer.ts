/**
 * PURPOSE: Returns the sorted indices visible in the tail-window collapsed state — the most recent MESSAGE anchor (text/user/system, not sub-agent-chain), every sub-agent chain after it, and the last unit. Intermediate tool pairs collapse out so streaming tool runs don't blow past a single screen height while parallel sub-agent chains stay visible (each has its own collapse).
 *
 * USAGE:
 * computeTailVisibleIndicesTransformer({
 *   isAnchorFlags: [false, true, true, true],   // tool, text, chainA, chainB
 *   isSubagentChainFlags: [false, false, true, true],
 * });
 * // Returns [1, 2, 3] — message anchor + both chains visible, tool hidden.
 */

import { tailStartIndexContract } from '../../contracts/tail-start-index/tail-start-index-contract';
import type { TailStartIndex } from '../../contracts/tail-start-index/tail-start-index-contract';

export const computeTailVisibleIndicesTransformer = ({
  isAnchorFlags,
  isSubagentChainFlags,
}: {
  isAnchorFlags: boolean[];
  isSubagentChainFlags: boolean[];
}): TailStartIndex[] => {
  const { length } = isAnchorFlags;
  if (length === 0) return [];

  let messageAnchorIndex = -1;
  for (let i = length - 1; i >= 0; i--) {
    const isAnchor = isAnchorFlags[i] === true;
    const isChain = isSubagentChainFlags[i] === true;
    if (isAnchor && !isChain) {
      messageAnchorIndex = i;
      break;
    }
  }

  const lastIndex = length - 1;
  const indices: TailStartIndex[] = [];
  for (let i = 0; i < length; i++) {
    const isPostAnchorChain =
      isSubagentChainFlags[i] === true && (messageAnchorIndex < 0 || i > messageAnchorIndex);
    if (i === messageAnchorIndex || isPostAnchorChain || i === lastIndex) {
      indices.push(tailStartIndexContract.parse(i));
    }
  }

  return indices;
};
