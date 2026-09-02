/**
 * PURPOSE: Every refusal on this path collapses to the same null rather than a distinct status,
 * because once a path has cleared the query string there is no quest-folder boundary left to
 * report a violation of — a 403 here would only leak whether some path exists. The extension
 * check stays even though the guard already sanitized the path: it is the last line of defence
 * so a future bind-address slip can serve a handful of image types and nothing an attacker
 * would actually want to read.
 *
 * USAGE:
 * const result = await imageServeBroker({ path: '/tmp/quest/images/abc.png' });
 * // → { bytes, contentType: 'image/png' } when servable, or null for any refusal
 */

import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';

import { fsReadFileBytesAdapter } from '../../../adapters/fs/read-file-bytes/fs-read-file-bytes-adapter';
import { processDevLogAdapter } from '../../../adapters/process/dev-log/process-dev-log-adapter';
import { isServableImagePathGuard } from '../../../guards/is-servable-image-path/is-servable-image-path-guard';
import { errorFormatReasonTransformer } from '../../../transformers/error-format-reason/error-format-reason-transformer';
import { imageContentTypeTransformer } from '../../../transformers/image-content-type/image-content-type-transformer';
import type { ImageContentType } from '../../../transformers/image-content-type/image-content-type-transformer';

export const imageServeBroker = async ({
  path,
}: {
  path: string;
}): Promise<{ bytes: Uint8Array; contentType: ImageContentType } | null> => {
  if (!isServableImagePathGuard({ path })) {
    return null;
  }

  const filePath = absoluteFilePathContract.parse(path);

  const contentType = imageContentTypeTransformer({ filePath });
  if (contentType === null) {
    return null;
  }

  try {
    const bytes = await fsReadFileBytesAdapter({ filePath });
    return { bytes, contentType };
  } catch (error: unknown) {
    const reason = errorFormatReasonTransformer({ error });
    processDevLogAdapter({ message: `Image read failed for ${filePath}: ${reason}` });
    return null;
  }
};
