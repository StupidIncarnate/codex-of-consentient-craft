/**
 * PURPOSE: Reads the string literal inside a `.brand<'Text'>()` call, as the node itself so a fixer
 * can replace exactly that text and a rule can read its `.value`. Null when the call carries no
 * string type argument, which keeps a hand-built `.brand()` from being guessed at.
 *
 * USAGE:
 * astBrandLiteralTransformer({ node: brandCallNode });
 * // Returns the Literal node for `'Quest'` in `.brand<'Quest'>()`
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const astBrandLiteralTransformer = ({
  node,
}: {
  node: TSESTree.CallExpression;
}): TSESTree.Node | null => {
  const [first] = node.typeArguments?.params ?? [];
  const literal = first?.type === AST_NODE_TYPES.TSLiteralType ? first.literal : undefined;

  return literal?.type === AST_NODE_TYPES.Literal && typeof literal.value === 'string'
    ? literal
    : null;
};
