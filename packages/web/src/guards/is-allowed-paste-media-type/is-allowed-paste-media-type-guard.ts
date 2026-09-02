/**
 * PURPOSE: This is the browser's half of a check the server also makes against the same list, so a
 * MIME type one side accepts is never silently refused by the other. Reach for this instead of
 * parsing through pastedImageMediaTypeContract when the caller needs an ANSWER rather than a throw —
 * a paste handler needs a boolean it can raise a toast on, not an exception to catch.
 *
 * USAGE:
 * isAllowedPasteMediaTypeGuard({mediaType: 'image/png'});
 * // Returns true
 */

import { pastedImageStatics } from '@dungeonmaster/shared/statics';

export const isAllowedPasteMediaTypeGuard = ({ mediaType }: { mediaType?: string }): boolean =>
  pastedImageStatics.allowedMediaTypes.some((allowed) => allowed === mediaType);
