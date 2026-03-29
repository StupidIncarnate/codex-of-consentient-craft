/**
 * PURPOSE: Walks the callee chain of an assertion call to find the originating expect() CallExpression
 *
 * USAGE:
 * const expectNode = astFindExpectCallTransformer({ node });
 * // Returns the expect() CallExpression node or null if the call is not on an expect chain
 *
 * WHEN-TO-USE: When detecting assertion patterns on expect() chains regardless of which matcher is used,
 * including chains through .not, .resolves, .rejects
 */
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

export const astFindExpectCallTransformer = ({ node }: { node: Tsestree }): Tsestree | null => {
  const { callee } = node;
  if (callee?.type !== 'MemberExpression') {
    return null;
  }

  let current = callee.object;

  // Walk through MemberExpression chains (.not, .resolves, .rejects)
  const maxChainDepth = 5;
  let depth = 0;
  while (current !== null && current !== undefined && depth < maxChainDepth) {
    if (current.type === 'CallExpression') {
      const isExpect = current.callee?.type === 'Identifier' && current.callee.name === 'expect';
      if (isExpect) {
        return current;
      }
      return null;
    }
    if (current.type === 'MemberExpression') {
      current = current.object;
      depth += 1;
    } else {
      return null;
    }
  }

  return null;
};
