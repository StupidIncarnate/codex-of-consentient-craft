/**
 * PURPOSE: Answers "what does this expression actually sit inside", skipping the TypeScript wrappers
 * that change a value's type but not its position — `['web'] as const` is still the initializer of
 * whatever the assertion is written into. Reach for this over a bare `node.parent` anywhere a rule
 * decides something from an expression's surroundings, because `as const` is the ordinary spelling
 * of a frozen literal in this repo and reading only one level up misses every one of them.
 *
 * USAGE:
 * effectiveExpressionParentTransformer({ node });
 * // For the ArrayExpression in `const UI = ['web'] as const;`, returns the VariableDeclarator
 *
 * WHEN-TO-USE: Inside a local ESLint rule walking upward from an expression node.
 */
import type { Tsestree } from '@dungeonmaster/eslint-plugin';

import { packageNameLiteralStatics } from '../../statics/package-name-literal/package-name-literal-statics';

export const effectiveExpressionParentTransformer = ({
  node,
}: {
  node?: Tsestree | null;
}): Tsestree | null => {
  const parent = node?.parent;

  if (parent === null || parent === undefined) {
    return null;
  }

  const isTransparent = packageNameLiteralStatics.transparentExpressionWrapperTypes.some(
    (wrapperType) => wrapperType === parent.type,
  );

  if (isTransparent) {
    return effectiveExpressionParentTransformer({ node: parent });
  }

  return parent;
};
