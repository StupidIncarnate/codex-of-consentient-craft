/**
 * PURPOSE: Refuses a `links.of` naming an ingredient this registry never declares — the runtime
 * counterpart of the phantom-property compile error, for a caller that reaches `registry()` from
 * plain JavaScript and never typechecked at all. Reach for this over `IngredientDeclarationError`:
 * the ingredient's OWN declaration is well-formed, and the problem is that its link points outside
 * the set this call assembled.
 *
 * USAGE:
 * throw new RegistryDanglingLinkError({
 *   ingredientName: 'quest',
 *   linkTarget: 'no-such-ingredient',
 *   registeredNames: ['guild', 'quest', 'operation'],
 * });
 * // Throws error naming the dangling link and every name this registry does hold
 *
 * WHEN-TO-USE: From `registryCreateBroker`, once an ingredient's `links.of` names something absent
 * from the names actually passed to `createHydration`.
 * WHEN-NOT-TO-USE: When the linked-to ingredient IS registered but one particular row's ancestor
 * chain does not happen to include it — that is a plan-time fact about a single row, not the
 * registry's shape, and throws `HydrationUnlinkedRowError` instead.
 */
export class RegistryDanglingLinkError extends Error {
  public constructor({
    ingredientName,
    linkTarget,
    registeredNames,
  }: {
    ingredientName: string;
    linkTarget: string;
    registeredNames: readonly string[];
  }) {
    super(
      `ingredient "${ingredientName}" links to "${linkTarget}", which this registry does not hold. Registered ingredient names: ${registeredNames.join(', ')}`,
    );
    this.name = 'RegistryDanglingLinkError';
  }
}
