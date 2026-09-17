/**
 * PURPOSE: Thrown when a recipe hands back a set of ids that does not match the `returns` its own
 * manifest declares — either a key it never promised, or a promise it did not keep. It exists
 * because "a recipe declares `produces:` and `fidelity`, and returns the ids it created. Those are
 * contract-shaped, so a `satisfies` catches a missing one at build time rather than at the moment a
 * walk needs an id that was never returned" (siegelense-recipes.md line 505) — this is that check,
 * made at the one moment both halves are in hand.
 *
 * An UNFULFILLED return is the expensive one: `{g.questId}` in a later step would resolve to
 * nothing and the walk would fail three steps on, against a screen, for a reason that is actually
 * here.
 *
 * USAGE:
 * throw new RecipeReturnsMismatchError({
 *   name: 'guild-with-three-quests', undeclared: ['guildPath'], unfulfilled: ['questId'],
 *   declared: ['guildId', 'guildSlug', 'questId'],
 * });
 * // Throws naming both halves and what the manifest declares
 */
export class RecipeReturnsMismatchError extends Error {
  public constructor({
    name,
    undeclared,
    unfulfilled,
    declared,
  }: {
    name: string;
    undeclared: readonly string[];
    unfulfilled: readonly string[];
    declared: readonly string[];
  }) {
    const undeclaredText =
      undeclared.length === 0 ? '' : ` Returned but never declared: ${undeclared.join(', ')}.`;
    const unfulfilledText =
      unfulfilled.length === 0 ? '' : ` Declared but not returned: ${unfulfilled.join(', ')}.`;

    super(
      `RECIPE RETURNS: "${name}" produced ids its manifest does not match.${undeclaredText}${unfulfilledText} Its manifest declares: ${declared.length === 0 ? '(none)' : declared.join(', ')}. The listing and the runner read ONE declaration — a recipe that made a thing it cannot name is a thing no step can reach.`,
    );
    this.name = 'RecipeReturnsMismatchError';
  }
}
