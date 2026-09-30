/**
 * PURPOSE: Finds the first duplicate ID in a modify-quest input and returns a descriptive error message
 *
 * USAGE:
 * questDuplicateIdMessageTransformer({updates: {flows: [FlowStub({id: 'a'}), FlowStub({id: 'a'})]}});
 * // Returns: 'Duplicate ID "a" in flows — this ID already exists. Use a unique ID or omit to leave existing unchanged.'
 */

import { isArrayOfItemsWithIdGuard } from '../../guards/is-array-of-items-with-id/is-array-of-items-with-id-guard';
import { questFindDuplicateIdTransformer } from '../quest-find-duplicate-id/quest-find-duplicate-id-transformer';

export const questDuplicateIdMessageTransformer = ({
  updates,
}: {
  updates: Record<PropertyKey, unknown>;
}): string | undefined => {
  for (const key of Object.keys(updates)) {
    const candidate = { value: updates[key] };
    if (isArrayOfItemsWithIdGuard(candidate)) {
      const duplicate = questFindDuplicateIdTransformer({
        items: candidate.value,
        context: key,
      });
      if (duplicate) {
        return duplicate;
      }
    }
  }

  return undefined;
};
