/**
 * PURPOSE: Refuses a `fromSaved` naming a FIELD that the saved record's own `record` contract never
 * declared — the record NAME resolves fine, but the field asked for is not one of its keys. Reach
 * for this over `HydrationSavedRecordMissingError`: that one is about the name failing to resolve
 * at all; this one is about a name that resolves to a real record with no such field, which would
 * otherwise silently answer `undefined` instead of naming the caller's mistake.
 *
 * USAGE:
 * throw new HydrationSavedFieldMissingError({
 *   recipeName: 'guild-mid-execution',
 *   ingredientName: 'quest',
 *   savedRecordName: 'guild',
 *   fieldName: 'urlSlug',
 *   declaredFieldNames: ['id', 'name'],
 * });
 * // Throws error naming the saved record, the missing field, and every field its record declares
 *
 * WHEN-TO-USE: From the pre-flight pass, once a `fromSaved` field fails to match a key on the
 * producing ingredient's own `record` contract.
 * WHEN-NOT-TO-USE: When the field IS one of the record's declared keys — the value resolves and
 * nothing throws.
 */
export class HydrationSavedFieldMissingError extends Error {
  public constructor({
    recipeName,
    ingredientName,
    savedRecordName,
    fieldName,
    declaredFieldNames,
  }: {
    recipeName: string;
    ingredientName: string;
    savedRecordName: string;
    fieldName: string;
    declaredFieldNames: readonly string[];
  }) {
    const declaredList = declaredFieldNames.length > 0 ? declaredFieldNames.join(', ') : '(none)';
    super(
      `recipe "${recipeName}": ingredient "${ingredientName}" calls fromSaved("${savedRecordName}", "${fieldName}"), but the record saved as "${savedRecordName}" never declares that field. Fields it declares: ${declaredList}`,
    );
    this.name = 'HydrationSavedFieldMissingError';
  }
}
