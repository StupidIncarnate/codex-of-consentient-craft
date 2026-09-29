/**
 * PURPOSE: Drives the `request` step verb — resolves the target HTTP URL against the lane's API
 * base URL (or uses an absolute URL directly), executes the request via `fetchWithStatus`,
 * throws an HttpRequestFailedError if the response status is 4xx/5xx (so expect: 'error' turns
 * it into a passing adversarial test), or renders the reading via httpRequestReadingRenderTransformer.
 * Reach for this over browser-based interaction when verifying backend APIs, curl surfaces, or
 * operational screenless flows.
 *
 * USAGE:
 * await stepRequestBroker({ lane, step });
 * // Returns '200 OK — {"id": "..."}' as ContentText or throws HttpRequestFailedError
 */

import type { ContentText } from '@dungeonmaster/shared/contracts';
import { environmentStatics } from '@dungeonmaster/shared/statics';
import { safeJsonParseTransformer } from '@dungeonmaster/shared/transformers';

import { fetchWithStatus } from '#gateway/node/fetch';

import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import type { Step } from '../../../contracts/step/step-contract';
import { HttpRequestFailedError } from '../../../errors/http-request-failed/http-request-failed-error';
import { requestStatics } from '../../../statics/request/request-statics';
import { httpRequestReadingRenderTransformer } from '../../../transformers/http-request-reading-render/http-request-reading-render-transformer';

export const stepRequestBroker = async ({
  lane,
  step,
}: {
  lane: LaneSession;
  step: Step & { step: 'request' };
}): Promise<ContentText> => {
  const baseUrl =
    'apiBaseUrl' in lane && typeof lane.apiBaseUrl === 'string'
      ? lane.apiBaseUrl
      : `http://${environmentStatics.hostname}:${String(lane.ports.api)}`;

  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = step.path.startsWith('/') ? step.path : `/${step.path}`;
  const url =
    step.path.startsWith('http://') || step.path.startsWith('https://')
      ? step.path
      : `${cleanBase}${cleanPath}`;

  const requestBody = step.body === null ? undefined : step.body;
  const hasContentType = Object.keys(step.headers ?? {}).some(
    (key) => key.toLowerCase() === 'content-type',
  );
  const needsContentType =
    requestBody !== undefined && typeof requestBody !== 'string' && !hasContentType;
  const headers = {
    ...step.headers,
    ...(needsContentType ? { 'content-type': requestStatics.defaults.contentType } : {}),
  };

  const response = await fetchWithStatus({
    url,
    method: step.method,
    headers,
    ...(requestBody === undefined ? {} : { body: requestBody }),
  });

  if (response.status >= requestStatics.status.clientErrorThreshold) {
    throw new HttpRequestFailedError({
      status: response.status,
      statusText: response.statusText,
      body: response.body,
      url,
    });
  }

  const parsedBody = safeJsonParseTransformer({ value: response.body });

  return httpRequestReadingRenderTransformer({
    status: response.status,
    statusText: response.statusText,
    body: parsedBody.ok ? parsedBody.value : response.body,
  });
};
