/**
 * PURPOSE: Determines whether an AST expression is sourced from a Zod contract validation chain
 *
 * USAGE:
 * const ok = checkIsValidatedExpressionLayerBroker({ node });
 * // Returns true if node is `<x>Contract.parse(...)`, `safeParse(...).data`, or a member-access chain rooted in either
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const checkIsValidatedExpressionLayerBroker = ({
  node,
}: {
  node?: TSESTree.Node | null;
}): boolean => {
  if (!node) {
    return false;
  }

  // Walk down through MemberExpression chain to find the root call
  if (node.type === AST_NODE_TYPES.CallExpression) {
    const { callee } = node;
    // Pattern A: <something>.parse(...) — accept any `.parse` MemberExpression callee
    return (
      callee.type === AST_NODE_TYPES.MemberExpression &&
      callee.property.type === AST_NODE_TYPES.Identifier &&
      callee.property.name === 'parse'
    );
    // Pattern B: safeParse(...) bare — only valid when followed by `.data` (handled at MemberExpression layer below)
  }

  if (node.type === AST_NODE_TYPES.MemberExpression) {
    // Pattern: <expr>.safeParse(...).data — node is `.data`, node.object is the safeParse call
    const { object, property } = node;
    if (
      property.type === AST_NODE_TYPES.Identifier &&
      property.name === 'data' &&
      object.type === AST_NODE_TYPES.CallExpression
    ) {
      const safeParseCallee = object.callee;
      if (
        safeParseCallee.type === AST_NODE_TYPES.MemberExpression &&
        safeParseCallee.property.type === AST_NODE_TYPES.Identifier &&
        safeParseCallee.property.name === 'safeParse'
      ) {
        return true;
      }
    }
    // Otherwise descend into the object side of the member expression (chain root).
    return checkIsValidatedExpressionLayerBroker({ node: object });
  }

  if (
    node.type === AST_NODE_TYPES.TSAsExpression ||
    node.type === AST_NODE_TYPES.TSNonNullExpression
  ) {
    return checkIsValidatedExpressionLayerBroker({ node: node.expression });
  }

  return false;
};
