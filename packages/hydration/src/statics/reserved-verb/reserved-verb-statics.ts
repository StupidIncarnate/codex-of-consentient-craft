/**
 * PURPOSE: The verbs the framework owns on every row, which an ingredient's `extras` may never
 * shadow. One source, read by `extraVerbNameContract`'s refusal, by `ingredientDeclareBroker`'s
 * declaration-time check, and by the tests that enumerate them — so a fourth structural verb
 * added later needs one edit, not three.
 *
 * USAGE:
 * reservedVerbStatics.verbs;
 * // Returns ['set', 'setRaw', 'remove', 'saveRecordAs']
 */
export const reservedVerbStatics = {
  verbs: ['set', 'setRaw', 'remove', 'saveRecordAs'],
} as const;
