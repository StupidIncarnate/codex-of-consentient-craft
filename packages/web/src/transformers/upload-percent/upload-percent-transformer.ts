/**
 * PURPOSE: An XHR `progress` event reports raw byte counts that are only safe to divide once the
 * total is known and the loaded count is bounded — a request whose length is not yet computable
 * reports a total of 0, and a chunked body can report loaded past total. Reach for this over doing
 * the division inline wherever an upload bar reads those two counts, so both browser quirks are
 * clamped in one place rather than re-guarded at every call site.
 *
 * USAGE:
 * uploadPercentTransformer({ bytesSent: ByteLengthStub({ value: 512 }), bytesTotal: ByteLengthStub({ value: 1024 }) });
 * // Returns: 50
 */

import { chatComposerStatics } from '../../statics/chat-composer/chat-composer-statics';

export const uploadPercentTransformer = ({
  bytesSent,
  bytesTotal,
}: {
  bytesSent: number;
  bytesTotal: number;
}): number => {
  if (bytesTotal === 0) {
    return chatComposerStatics.upload.minPercent;
  }

  if (bytesSent >= bytesTotal) {
    return chatComposerStatics.upload.maxPercent;
  }

  return Math.round((bytesSent / bytesTotal) * chatComposerStatics.upload.maxPercent);
};
