/**
 * PURPOSE: Thrown when a `seed` step or `start --seed` names a recipe the book does not declare.
 * It exists so the refusal carries the BOOK: a session that misremembers a name has the list it
 * should have read in front of it, rather than a bare "not found" and a second call to `recipes`.
 * Reach for this over `RecipePackageMissingError`: that one means the recipes package is absent
 * entirely, which is a different problem with a different fix.
 *
 * USAGE:
 * throw new RecipeUnknownError({ name: 'guild-with-4-quests', known: ['guild-with-three-quests'] });
 * // Throws naming the recipe and listing every declared one
 */
export class RecipeUnknownError extends Error {
  public constructor({ name, known }: { name: string; known: readonly string[] }) {
    super(
      `UNKNOWN RECIPE: "${name}" is not in the recipe book. Declared: ${known.length === 0 ? '(none yet)' : known.join(', ')}. Run \`dungeonmaster siegelense recipes\` for each one's produces: line and fidelity.`,
    );
    this.name = 'RecipeUnknownError';
  }
}
