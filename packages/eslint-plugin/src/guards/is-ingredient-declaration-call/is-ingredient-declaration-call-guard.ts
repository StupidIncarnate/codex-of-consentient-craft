/**
 * PURPOSE: Answers whether an AST node IS a call to the hydration framework's `ingredient({...})`
 * declaration function — the truthful signal for "this file declares an ingredient," independent
 * of where the file lives or what it is named. This is what makes the ban rules work in a
 * consumer repo that never adopts this repo's `*-recipes`/`ingredient/` folder convention: every
 * real ingredient, anywhere, calls this function to exist.
 *
 * Matches only a BARE identifier call (`ingredient({...})`), which is how every real ingredient in
 * this repo calls it, once destructured off `recipesHydrationCreateBroker()`. A member-expression
 * form (`dm.ingredient({...})`, used only in `@dungeonmaster/hydration`'s own fixtures) and an
 * aliased import (`import { ingredient as makeIngredient }`) are both invisible to it.
 *
 * USAGE:
 * isIngredientDeclarationCallGuard({ node: callExpressionNode });
 * // Returns true for `ingredient({ name: 'quest', ... })`, false for `dm.ingredient({...})`,
 * // `ingredient()` with no argument, or any call to a differently-named function
 */
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';
import { ingredientDeclarationStatics } from '../../statics/ingredient-declaration/ingredient-declaration-statics';

export const isIngredientDeclarationCallGuard = ({ node }: { node?: Tsestree }): boolean => {
  if (node === undefined || node.type !== 'CallExpression') {
    return false;
  }

  const { callee, arguments: callArguments } = node;
  const calleeIsDeclarationFunction =
    callee?.type === 'Identifier' &&
    callee.name === ingredientDeclarationStatics.declarationFunctionName;

  return calleeIsDeclarationFunction && (callArguments?.length ?? 0) > 0;
};
