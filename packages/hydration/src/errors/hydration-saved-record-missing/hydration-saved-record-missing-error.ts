/**
 * PURPOSE: Refuses a `fromSaved` naming a record no `saveRecordAs` in this plan produces — including
 * one declared LATER in build order, since the chain has not seen the whole plan by the time it
 * writes a cross-link. Reach for this over `HydrationUnlinkedRowError`: this is about a cross-link's
 * NAME failing to resolve against what the plan actually saves, not about a row's structural
 * ancestor being missing.
 *
 * USAGE:
 * throw new HydrationSavedRecordMissingError({
 *   recipeName: 'guild-mid-execution',
 *   ingredientName: 'session',
 *   savedRecordName: 'origin',
 *   availableSavedRecordNames: ['guild', 'quest'],
 * });
 * // Throws error naming the missing saved record and every name this plan does save
 *
 * WHEN-TO-USE: From the pre-flight pass, once it walks the finished op tree and finds a `fromSaved`
 * whose name never appears in an earlier `saveRecord` op.
 * WHEN-NOT-TO-USE: When the name IS saved somewhere in the plan — the value resolves and nothing
 * throws.
 */
export class HydrationSavedRecordMissingError extends Error {
  public constructor({
    recipeName,
    ingredientName,
    savedRecordName,
    availableSavedRecordNames,
  }: {
    recipeName: string;
    ingredientName: string;
    savedRecordName: string;
    availableSavedRecordNames: readonly string[];
  }) {
    const availableList =
      availableSavedRecordNames.length > 0 ? availableSavedRecordNames.join(', ') : '(none)';
    super(
      `recipe "${recipeName}": ingredient "${ingredientName}" calls fromSaved("${savedRecordName}"), but no op in this plan saves that name. Names saved by this plan: ${availableList}`,
    );
    this.name = 'HydrationSavedRecordMissingError';
  }
}
