/**
 * PURPOSE: Every refusal on this route — no path parameter, a hostile path, a missing file —
 * collapses to the same 404 with an empty body, never a 403. Past the query string there is no
 * quest-folder boundary left to report a violation of, and a distinct status would only leak
 * whether some path exists. The try/catch around the broker call is defensive: the broker is
 * documented never to throw, but this is the layer that keeps that true even if something beneath
 * it changes later.
 *
 * USAGE:
 * const result = await ImageServeResponder({ path: '/tmp/quest/images/abc.png' });
 * // → { status: 200, bytes, contentType: 'image/png' } when servable, or the 404 shape otherwise
 */

import { processDevLogAdapter } from '../../../adapters/process/dev-log/process-dev-log-adapter';
import { imageServeBroker } from '../../../brokers/image/serve/image-serve-broker';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';
import { errorFormatReasonTransformer } from '../../../transformers/error-format-reason/error-format-reason-transformer';
import type { ImageContentType } from '../../../transformers/image-content-type/image-content-type-transformer';

export const ImageServeResponder = async ({
  path,
}: {
  path: string | undefined;
}): Promise<{
  status: typeof httpStatusStatics.success.ok | typeof httpStatusStatics.clientError.notFound;
  bytes: Uint8Array;
  contentType: ImageContentType | null;
}> => {
  if (path === undefined) {
    return {
      status: httpStatusStatics.clientError.notFound,
      bytes: new Uint8Array(),
      contentType: null,
    };
  }

  try {
    const result = await imageServeBroker({ path });
    if (result === null) {
      return {
        status: httpStatusStatics.clientError.notFound,
        bytes: new Uint8Array(),
        contentType: null,
      };
    }
    return {
      status: httpStatusStatics.success.ok,
      bytes: result.bytes,
      contentType: result.contentType,
    };
  } catch (error: unknown) {
    processDevLogAdapter({
      message: `Image serve failed for ${path}: ${errorFormatReasonTransformer({ error })}`,
    });
    return {
      status: httpStatusStatics.clientError.notFound,
      bytes: new Uint8Array(),
      contentType: null,
    };
  }
};
