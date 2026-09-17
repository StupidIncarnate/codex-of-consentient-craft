/**
 * PURPOSE: Thrown when `dungeonmaster siegelense recipes` finds no `packages/siegelense-recipes/`
 * at all. It exists so that answer never reads like an EMPTY one: an empty package says "no recipes
 * yet", an absent package can only say "something is wrong", and a tool that answered `[]` for both
 * cannot tell "you have written none" from "you have not installed this" — the `count: 0` ambiguity
 * this design keeps running into, one layer up (siegelense-tooling.md lines 1977-1980). Reach for
 * this ONLY for the absent-package case; a package holding no recipes answers normally with an empty
 * list and is not an error at all.
 *
 * USAGE:
 * throw new RecipePackageMissingError({ expectedPath: '/repo/packages/siegelense-recipes' });
 * // Throws error naming the path and how to create it
 */
export class RecipePackageMissingError extends Error {
  public constructor({ expectedPath }: { expectedPath: string }) {
    super(
      `No recipes package at "${expectedPath}". That path is a convention, not a setting — every repo siegelense runs in has it, and an empty one is a real answer meaning "no recipes yet". Its absence means siegelense was never installed here: run dungeonmaster init.`,
    );
    this.name = 'RecipePackageMissingError';
  }
}
