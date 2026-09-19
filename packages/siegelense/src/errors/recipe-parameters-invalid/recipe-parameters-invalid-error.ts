/**
 * PURPOSE: Thrown when a `seed` step's parameters do not match what the named recipe's manifest
 * declares — a required one missing, or a key the recipe never takes. It exists because the `seed`
 * member of `stepContract` is the ONE member that is not `.strict()`: parameters ride the step as
 * top-level keys (siegelense-tooling.md line 2921), so zod cannot tell a parameter from a typo.
 * Only the manifest knows, which is why the refusal lives one layer up and names the offending key
 * rather than silently dropping it.
 *
 * USAGE:
 * throw new RecipeParametersInvalidError({
 *   name: 'session-with-nested-subagent', missing: ['guild'], unknown: ['gild'],
 *   declared: ['guild'],
 * });
 * // Throws naming each bad key and what the recipe actually takes
 */
export class RecipeParametersInvalidError extends Error {
  public constructor({
    name,
    missing,
    unknown,
    declared,
  }: {
    name: string;
    missing: readonly string[];
    unknown: readonly string[];
    declared: readonly string[];
  }) {
    const missingText = missing.length === 0 ? '' : ` Missing: ${missing.join(', ')}.`;
    const unknownText =
      unknown.length === 0 ? '' : ` Not a parameter of this recipe: ${unknown.join(', ')}.`;

    super(
      `RECIPE PARAMETERS: "${name}" was called with parameters it cannot take.${missingText}${unknownText} It declares: ${declared.length === 0 ? '(none)' : declared.join(', ')}. Parameters are written as top-level keys on the step — { "step": "seed", "recipe": "${name}", "guild": "{g.guildId}", "as": "s" }.`,
    );
    this.name = 'RecipeParametersInvalidError';
  }
}
