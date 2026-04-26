/**
 * PURPOSE: Determines whether an AST node is a direct `JSON.parse(...)` call expression
 *
 * USAGE:
 * const ok = checkIsJsonParseCallLayerBroker({ node });
 * // Returns true if node is a CallExpression whose callee is `JSON.parse`
 */
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';

export const checkIsJsonParseCallLayerBroker = ({ node }: { node?: Tsestree | null }): boolean => {
  if (!node || node.type !== 'CallExpression') {
    return false;
  }
  const { callee } = node;
  if (!callee || callee.type !== 'MemberExpression') {
    return false;
  }
  const { object, property } = callee;
  return Boolean(
    object &&
      object.type === 'Identifier' &&
      object.name === 'JSON' &&
      property &&
      property.type === 'Identifier' &&
      property.name === 'parse',
  );
};
