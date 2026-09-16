/**
 * PURPOSE: Refuses an ingredient declaration that cannot be honoured — no routes at all, a `write`
 * route with no `copies` target, or an extra whose name shadows a built-in verb. Reach for this over
 * letting the zod parse fail on its own: a consumer calling `ingredientDeclareBroker` from plain
 * JavaScript, never having typechecked at all, gets the same refusal by name that the types give
 * TypeScript, and naming the ingredient is what tells a five-ingredient plan's reader which one is
 * wrong.
 *
 * USAGE:
 * throw new IngredientDeclarationError({ ingredientName: 'quest', reason: 'declares no routes' });
 * // Throws error naming the ingredient and what about its declaration is wrong
 *
 * WHEN-TO-USE: From `ingredientDeclareBroker`, once a declaration fails a routes/copies/extras rule
 * this repo's type system cannot enforce at the call site.
 * WHEN-NOT-TO-USE: For a registry-level problem spanning more than one ingredient — two names
 * colliding, or a `links.of` naming nothing registered — those throw `RegistryDuplicateNameError` or
 * `RegistryDanglingLinkError` instead, because this ingredient's OWN declaration is well-formed.
 */
export class IngredientDeclarationError extends Error {
  public constructor({ ingredientName, reason }: { ingredientName: string; reason: string }) {
    super(`ingredient "${ingredientName}" ${reason}`);
    this.name = 'IngredientDeclarationError';
  }
}
