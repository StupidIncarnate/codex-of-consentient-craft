/**
 * PURPOSE: Determines whether an AST expression is sourced from a Zod contract validation chain
 *
 * USAGE:
 * const ok = checkIsValidatedExpressionLayerBroker({ node });
 * // Returns true if node is `<x>Contract.parse(...)`, `safeParse(...).data`, or a member-access chain rooted in either
 */
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';

export const checkIsValidatedExpressionLayerBroker = ({
  node,
}: {
  node?: Tsestree | null;
}): boolean => {
  if (!node) {
    return false;
  }

  // Walk down through MemberExpression chain to find the root call
  let current: Tsestree | null | undefined = node;
  while (current) {
    if (current.type === 'CallExpression') {
      const { callee } = current;
      if (!callee) {
        return false;
      }
      // Pattern A: <something>.parse(...) — accept any `.parse` MemberExpression callee
      if (
        callee.type === 'MemberExpression' &&
        callee.property &&
        callee.property.type === 'Identifier' &&
        callee.property.name === 'parse'
      ) {
        return true;
      }
      // Pattern B: safeParse(...) bare — only valid when followed by `.data` (handled at MemberExpression layer below)
      return false;
    }

    if (current.type === 'MemberExpression') {
      // Pattern: <expr>.safeParse(...).data — current is `.data`, current.object is the safeParse call
      const { object, property } = current;
      if (
        property &&
        property.type === 'Identifier' &&
        property.name === 'data' &&
        object &&
        object.type === 'CallExpression'
      ) {
        const safeParseCallee = object.callee;
        if (
          safeParseCallee &&
          safeParseCallee.type === 'MemberExpression' &&
          safeParseCallee.property &&
          safeParseCallee.property.type === 'Identifier' &&
          safeParseCallee.property.name === 'safeParse'
        ) {
          return true;
        }
      }
      // Otherwise descend into the object side of the member expression (chain root).
      current = current.object;
      continue;
    }

    if (current.type === 'TSAsExpression' || current.type === 'TSNonNullExpression') {
      current = current.expression;
      continue;
    }

    return false;
  }
  return false;
};
