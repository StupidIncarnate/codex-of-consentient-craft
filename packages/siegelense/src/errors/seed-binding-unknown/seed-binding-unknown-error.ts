/**
 * PURPOSE: Thrown when a step carries a `{name.field}` placeholder that this batch's bindings
 * cannot answer — either nothing has been seeded under `name`, or it has but holds no `field`. It
 * exists so a misspelled binding never interpolates as a LITERAL: `{g.guildSlug}` passing through
 * unchanged becomes a `goto` to a nonsense URL and a NO MATCH three steps later, which is the
 * worst possible place to learn about a typo.
 *
 * The message lists what IS bound, and — when the binding itself resolves — what that binding
 * holds, because the answer to "which field did I mean" is almost always on that list.
 *
 * USAGE:
 * throw new SeedBindingUnknownError({
 *   placeholder: '{g.guildSlugg}', binding: 'g',
 *   knownBindings: ['g'], knownFields: ['guildId', 'guildSlug', 'questId'],
 * });
 * // Throws naming the placeholder, the binding, and what was available
 */
export class SeedBindingUnknownError extends Error {
  public constructor({
    placeholder,
    binding,
    knownBindings,
    knownFields,
  }: {
    placeholder: string;
    binding: string;
    knownBindings: readonly string[];
    knownFields: readonly string[] | null;
  }) {
    const bindingsText =
      knownBindings.length === 0
        ? 'no `seed` step in this batch has bound anything yet'
        : `bound in this batch: ${knownBindings.join(', ')}`;
    const fieldsText =
      knownFields === null
        ? ''
        : ` "${binding}" holds: ${knownFields.length === 0 ? '(nothing)' : knownFields.join(', ')}.`;

    super(
      `UNKNOWN BINDING: ${placeholder} cannot be resolved — ${bindingsText}.${fieldsText} A binding is minted by a { "step": "seed", "recipe": "…", "as": "${binding}" } EARLIER IN THIS BATCH, and lives only for that batch. Nothing is interpolated as a literal: a placeholder that survived would become a URL nobody meant.`,
    );
    this.name = 'SeedBindingUnknownError';
  }
}
