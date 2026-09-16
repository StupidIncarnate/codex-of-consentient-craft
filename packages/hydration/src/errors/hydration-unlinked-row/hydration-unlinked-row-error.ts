/**
 * PURPOSE: Refuses a row, before the first write, whose `links` names a parent nothing in its own
 * ancestor chain supplies — including a row added at the TOP LEVEL, which `Entry<R>` hands a
 * collection for regardless of nesting, so the type system lets it compile clean. Reach for this
 * over `RegistryDanglingLinkError`: the linked-to ingredient IS registered and its declaration IS
 * well-formed; this particular row's PLACEMENT in the chain is what is wrong.
 *
 * USAGE:
 * throw new HydrationUnlinkedRowError({
 *   recipeName: 'guild-mid-execution',
 *   ingredientName: 'quest',
 *   missingParentName: 'guild',
 * });
 * // Throws error naming the recipe, the ingredient and the ancestor it needed but did not have
 *
 * WHEN-TO-USE: From the pre-flight pass, once it walks the finished op tree and finds a `create` op
 * whose ancestor chain does not contain the ingredient its `links.of` names.
 * WHEN-NOT-TO-USE: When every row's ancestor chain does supply what its links require — the plan
 * proceeds and nothing throws.
 */
export class HydrationUnlinkedRowError extends Error {
  public constructor({
    recipeName,
    ingredientName,
    missingParentName,
  }: {
    recipeName: string;
    ingredientName: string;
    missingParentName: string;
  }) {
    super(
      `recipe "${recipeName}": ingredient "${ingredientName}" needs a "${missingParentName}" ancestor to fill its link, but this row has none — including a row added at the top level, which the type system allows freely`,
    );
    this.name = 'HydrationUnlinkedRowError';
  }
}
