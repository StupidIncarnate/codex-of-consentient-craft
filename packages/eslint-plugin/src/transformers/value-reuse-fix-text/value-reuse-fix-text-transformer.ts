/**
 * PURPOSE: Writes the text that replaces a contract key's value with a reuse of the owner's field,
 * keeping the `.optional()`, `.nullable()` and `.nullish()` calls that ended the old value, since
 * those decide whether the key may be absent. A value carrying a default has no safe rewrite: the
 * default belongs to that key alone, so a person decides.
 *
 * USAGE:
 * valueReuseFixTextTransformer({ valueText: 'questIdContract.optional()', reuse: 'questContract.shape.id' });
 * // Returns 'questContract.shape.id.optional()'; null for 'z.string().default("x")'
 */
import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

const TRAILING_MODIFIERS = /(?:\.(?:optional|nullable|nullish)\(\))+$/u;

export const valueReuseFixTextTransformer = ({
  valueText,
  reuse,
}: {
  valueText: string;
  reuse: string;
}): ContentText | null => {
  if (valueText.includes('.default(')) {
    return null;
  }
  const tail = TRAILING_MODIFIERS.exec(valueText.trim())?.[0] ?? '';
  return contentTextContract.parse(`${reuse}${tail}`);
};
