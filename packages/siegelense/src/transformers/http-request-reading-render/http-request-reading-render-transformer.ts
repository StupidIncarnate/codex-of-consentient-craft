/**
 * PURPOSE: Formats an HTTP request outcome into a single-line ContentText reading containing
 * status, status text, and serialized or string body representation. Reach for this over inline
 * string interpolation so request step reading formatting stays consistent and centralized.
 *
 * USAGE:
 * httpRequestReadingRenderTransformer({ status: 200, statusText: 'OK', body: { ok: true } });
 * // Returns '200 OK — {"ok":true}' as ContentText
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import { requestStatics } from '../../statics/request/request-statics';

export const httpRequestReadingRenderTransformer = ({
  status,
  statusText,
  body,
}: {
  status: number;
  statusText: string;
  body: unknown;
}): ContentText => {
  const bodyPreview =
    typeof body === 'object' && body !== null ? JSON.stringify(body) : String(body);
  return contentTextContract.parse(
    `${String(status)} ${statusText}${requestStatics.reading.delimiter}${bodyPreview}`,
  );
};
