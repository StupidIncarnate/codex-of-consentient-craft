/**
 * PURPOSE: Represents `start --seed`'s refusal of a recipe that declares one or more inputs —
 * `--seed <recipeName>` is a bare flag with nowhere to carry `params`, unlike a `run` batch's own
 * `seed` step, so a recipe with inputs BOOTED anyway and then failed deep inside
 * `recipesSeedRunBroker` with a raw Zod issue dump naming an internal broker, after an instance had
 * already come up just to be torn down. Thrown BEFORE `instanceStartBroker` ever runs, off the
 * recipe listing's own `inputKeys` (`recipeListingEntryContract`), so a booted-then-killed instance
 * never happens for this case at all.
 *
 * USAGE:
 * throw new SeedRecipeNeedsInputError({
 *   recipeName: 'quest-advances-one-step',
 *   inputKeys: ['guildId'],
 * });
 * // Throws naming the recipe, its declared inputs, and ONE `--steps` array, in run order, that can supply them
 *
 * WHEN-TO-USE: From `SiegelenseStartResponder`, once the named `--seed` recipe's listing entry
 * carries a non-empty `inputKeys`.
 * WHEN-NOT-TO-USE: For an unrecognised `--seed` recipe name — that case names no inputs to report and
 * gets its own refusal instead.
 */
export class SeedRecipeNeedsInputError extends Error {
  public constructor({
    recipeName,
    inputKeys,
  }: {
    recipeName: string;
    inputKeys: readonly string[];
  }) {
    const inputList = inputKeys.join(', ');
    const paramsObject = inputKeys
      .map((key) => `"${key}":"{g.guild.${key === 'guildPath' ? 'path' : 'id'}}"`)
      .join(',');

    super(
      `Recipe "${recipeName}" needs the input${inputKeys.length > 1 ? 's' : ''} ${inputList}, ` +
        `which start --seed cannot supply. Start without --seed, then pass this one --steps array ` +
        `to run (a binding lasts one batch), in run order: ` +
        `[{"step":"seed","recipe":"guild-empty","as":"g"},` +
        `{"step":"seed","recipe":"${recipeName}","params":{${paramsObject}}}].`,
    );
    this.name = 'SeedRecipeNeedsInputError';
  }
}
