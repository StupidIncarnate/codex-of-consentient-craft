/**
 * PURPOSE: Refuses a plan, before the first write, where a removed row handle is subsequently
 * targeted by another verb (`set`, `saveRecordAs`, `remove`, or an extra verb). Once a row is
 * removed, no further verbs may target it. Reach for this over a runtime error during the walk:
 * pre-flight catches illegal operations on removed handles before any mutations occur on disk or API.
 *
 * USAGE:
 * throw new HydrationRemovedHandleVerbError({
 *   recipeName: 'guild-mid-execution',
 *   ingredientName: 'quest',
 *   ref: 'guild[0:0]/quest[0:0]',
 *   verb: 'set',
 * });
 * // Throws error naming the recipe, ingredient, ref, and verb
 *
 * WHEN-TO-USE: From the pre-flight pass, when walking the plan ops and encountering a verb
 * targeting a row ref that has already been marked as removed.
 * WHEN-NOT-TO-USE: When ops target live rows that have not been removed.
 */
export class HydrationRemovedHandleVerbError extends Error {
  public readonly ref: string;
  public readonly verb: string;

  public constructor({
    recipeName,
    ingredientName,
    ref,
    verb,
  }: {
    recipeName: string;
    ingredientName: string;
    ref: string;
    verb: string;
  }) {
    super(
      `recipe "${recipeName}": ingredient "${ingredientName}" calls "${verb}" on removed row "${ref}". Once a row is removed, no further verbs may target it.`,
    );
    this.name = 'HydrationRemovedHandleVerbError';
    this.ref = ref;
    this.verb = verb;
  }
}
