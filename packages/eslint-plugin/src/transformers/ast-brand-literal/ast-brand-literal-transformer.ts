/**
 * PURPOSE: Reads the string literal inside a `.brand<'Text'>()` call, as the node itself so a fixer
 * can replace exactly that text and a rule can read its `.value`. Null when the call carries no
 * string type argument, which keeps a hand-built `.brand()` from being guessed at.
 *
 * USAGE:
 * astBrandLiteralTransformer({ node: brandCallNode });
 * // Returns the Literal node for `'Quest'` in `.brand<'Quest'>()`
 */
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

export const astBrandLiteralTransformer = ({ node }: { node: Tsestree }): Tsestree | null => {
  const typeArguments = node.typeArguments ?? node.typeParameters;
  const [first] = typeArguments?.params ?? [];
  const literal = first?.type === 'TSLiteralType' ? first.literal : undefined;

  return literal?.type === 'Literal' && typeof literal.value === 'string' ? literal : null;
};
