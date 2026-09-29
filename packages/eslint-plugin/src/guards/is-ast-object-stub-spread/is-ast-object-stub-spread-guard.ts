/**
 * PURPOSE: Checks if an object expression is built entirely from spreads of stub calls
 *
 * USAGE:
 * const objNode = // AST node for: { ...WalkFactsStub() }
 * if (isAstObjectStubSpreadGuard({ node: objNode })) {
 *   // Object is a clone of stub output, not a hand-built literal
 * }
 * // Returns true only when every property is a SpreadElement over a *Stub() call
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const isAstObjectStubSpreadGuard = ({ node }: { node?: TSESTree.Node }): boolean => {
  if (node === undefined || node.type !== AST_NODE_TYPES.ObjectExpression) {
    return false;
  }

  if (node.properties.length === 0) {
    return false;
  }

  return node.properties.every((property) => {
    const argument = property.type === AST_NODE_TYPES.SpreadElement ? property.argument : undefined;

    if (
      property.type !== AST_NODE_TYPES.SpreadElement ||
      argument?.type !== AST_NODE_TYPES.CallExpression
    ) {
      return false;
    }

    const { callee } = argument;

    return callee.type === AST_NODE_TYPES.Identifier && callee.name.endsWith('Stub');
  });
};
