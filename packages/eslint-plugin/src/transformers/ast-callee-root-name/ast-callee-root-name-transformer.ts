/**
 * PURPOSE: Extracts the root identifier name from a CallExpression callee, handling Identifier, MemberExpression, and chained call patterns
 *
 * USAGE:
 * const name = astCalleeRootNameTransformer({ node: callExpressionNode });
 * // Returns 'describe' for describe(...), describe.each(...)(...), describe.only(...)
 * // Returns 'it' for it(...), it.each(...)(...), it.skip(...)
 * // Returns null if callee is not a recognized pattern
 *
 * WHEN-TO-USE: When an ESLint rule needs to identify the base test function (describe/it/test) regardless of chaining (.each, .only, .skip)
 */
import { identifierContract } from '@dungeonmaster/shared/contracts';
import type { Identifier } from '@dungeonmaster/shared/contracts';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const astCalleeRootNameTransformer = ({
  node,
}: {
  node?: TSESTree.CallExpression;
}): Identifier | null => {
  if (!node) {
    return null;
  }

  const { callee } = node;

  // Plain: describe(...) / it(...) / test(...)
  if (callee.type === AST_NODE_TYPES.Identifier) {
    return identifierContract.parse(callee.name);
  }

  // Chained property: describe.only(...) / it.skip(...) / test.each(table)
  if (
    callee.type === AST_NODE_TYPES.MemberExpression &&
    callee.object.type === AST_NODE_TYPES.Identifier
  ) {
    return identifierContract.parse(callee.object.name);
  }

  // Double call: describe.each(table)('name', fn) — callee is CallExpression whose callee is MemberExpression
  if (callee.type === AST_NODE_TYPES.CallExpression) {
    const innerCallee = callee.callee;

    if (innerCallee.type === AST_NODE_TYPES.Identifier) {
      return identifierContract.parse(innerCallee.name);
    }

    if (
      innerCallee.type === AST_NODE_TYPES.MemberExpression &&
      innerCallee.object.type === AST_NODE_TYPES.Identifier
    ) {
      return identifierContract.parse(innerCallee.object.name);
    }
  }

  return null;
};
