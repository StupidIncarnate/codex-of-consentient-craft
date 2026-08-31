/**
 * PURPOSE: True when a raw message string carries at least one pasted-image markdown token
 * (`![Pasted Image N](path)`). The chat-prompt build path reaches for this single cheap
 * existence check to decide whether the read-the-images trailer belongs on this prompt at all,
 * without caring how many tokens there are or what paths they hold.
 *
 * USAGE:
 * hasPastedImageTokensGuard({ text: 'see ![Pasted Image 1](/tmp/a.png) above' });
 * // Returns true
 * hasPastedImageTokensGuard({ text: 'just plain text' });
 * // Returns false
 */

import { pastedImageStatics } from '@dungeonmaster/shared/statics';

export const hasPastedImageTokensGuard = ({ text }: { text?: string }): boolean => {
  if (text === undefined) {
    return false;
  }
  return new RegExp(pastedImageStatics.imageTokenPattern, 'u').test(text);
};
