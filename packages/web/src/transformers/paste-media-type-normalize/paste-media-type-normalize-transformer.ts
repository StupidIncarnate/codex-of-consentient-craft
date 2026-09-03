/**
 * PURPOSE: A clipboard-declared MIME type is attacker/OS-controlled and can vary from its canonical
 * form only by case or surrounding whitespace ('IMAGE/PNG', ' image/png '), so handlePaste's
 * file-item selection test and isAllowedPasteMediaTypeGuard's exact-match check must read the
 * identical normalised string — otherwise the two can disagree about the very same clipboard item,
 * which is what let a wrong-case or blank type fall through both checks unnoticed.
 *
 * USAGE:
 * pasteMediaTypeNormalizeTransformer({ mediaType: 'IMAGE/PNG' });
 * // Returns 'image/png' as NormalizedPasteMediaType
 */

import { normalizedPasteMediaTypeContract } from '../../contracts/normalized-paste-media-type/normalized-paste-media-type-contract';
import type { NormalizedPasteMediaType } from '../../contracts/normalized-paste-media-type/normalized-paste-media-type-contract';

export const pasteMediaTypeNormalizeTransformer = ({
  mediaType,
}: {
  mediaType: string;
}): NormalizedPasteMediaType =>
  normalizedPasteMediaTypeContract.parse(mediaType.trim().toLowerCase());
