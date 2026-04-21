/**
 * PURPOSE: Maps a StatusLiteralKind (quest/workItem/ambiguous) to the ban-quest-status-literals rule's messageId string.
 *
 * USAGE:
 * statusLiteralMessageIdTransformer({ kind: 'quest' });
 * // Returns 'questStatusLiteral'
 * statusLiteralMessageIdTransformer({ kind: 'workItem' });
 * // Returns 'workItemStatusLiteral'
 * statusLiteralMessageIdTransformer({ kind: 'ambiguous' });
 * // Returns 'ambiguousStatusLiteral'
 *
 * WHEN-TO-USE: Only the ban-quest-status-literals rule broker should call this.
 */
import type { StatusLiteralKind } from '../classify-status-literal/classify-status-literal-transformer';

export type StatusLiteralMessageId =
  | 'questStatusLiteral'
  | 'workItemStatusLiteral'
  | 'ambiguousStatusLiteral';

export const statusLiteralMessageIdTransformer = ({
  kind,
}: {
  kind: StatusLiteralKind;
}): StatusLiteralMessageId => {
  if (kind === 'quest') {
    return 'questStatusLiteral';
  }
  if (kind === 'workItem') {
    return 'workItemStatusLiteral';
  }
  return 'ambiguousStatusLiteral';
};
