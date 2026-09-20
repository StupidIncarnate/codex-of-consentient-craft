/**
 * PURPOSE: Refuses a nested op inside a `filter` whose own declared ingredient names something this
 * run's `ingredients` never registered. Reach for this over `RegistryDanglingLinkError`: that class
 * fires from `registryCreateBroker`, over a `links.of` naming an ingredient absent from the whole
 * registry; this one fires from the WALK itself, over a nested `create`/`set`/`remove`/`extra`/
 * `filter` — the one op shape the typed chain never produces (`Matched<I>` exposes no `add` and no
 * child collection), so nothing upstream already proved its ingredient resolves.
 *
 * USAGE:
 * throw new HydrationNestedIngredientUnregisteredError({
 *   recipeName: 'drop-riftcarver-item',
 *   ingredientName: 'operation',
 *   registeredIngredientNames: ['quest'],
 * });
 * // Throws error naming the recipe, the unresolvable nested ingredient and every name this run holds
 *
 * WHEN-TO-USE: From `opFilterApplyLayerBroker`, once a nested op's own ingredient — read from
 * `ingredient` for `create`/`filter`, or recovered from `ref` for `set`/`remove`/`extra` — fails to
 * resolve against the ingredients this run was handed.
 * WHEN-NOT-TO-USE: When the nested op's ingredient DOES resolve — the walk runs that ingredient's own
 * routes, links and record, never the enclosing filter's.
 */
export class HydrationNestedIngredientUnregisteredError extends Error {
  public constructor({
    recipeName,
    ingredientName,
    registeredIngredientNames,
  }: {
    recipeName: string;
    ingredientName: string;
    registeredIngredientNames: readonly string[];
  }) {
    super(
      `recipe "${recipeName}": a nested op inside a filter names ingredient "${ingredientName}", which this run's ingredients do not include. Registered ingredient names: ${registeredIngredientNames.join(', ')}`,
    );
    this.name = 'HydrationNestedIngredientUnregisteredError';
  }
}
