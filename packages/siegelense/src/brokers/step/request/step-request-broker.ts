/**
 * PURPOSE: Drives the `request` step verb — resolves the target HTTP URL against the lane's API
 * base URL (or uses an absolute URL directly), executes the request via fetchHttpRequestAdapter,
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

import { fetchHttpRequestAdapter } from '../../../adapters/fetch/http-request/fetch-http-request-adapter';
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

  const reading = await fetchHttpRequestAdapter({
    url,
    method: step.method,
    ...(step.headers === undefined ? {} : { headers: step.headers }),
    ...(step.body === undefined ? {} : { body: step.body }),
  });

  if (reading.status >= requestStatics.status.clientErrorThreshold) {
    throw new HttpRequestFailedError({
      status: reading.status,
      statusText: reading.statusText,
      body: typeof reading.body === 'string' ? reading.body : JSON.stringify(reading.body),
      url,
    });
  }

  return httpRequestReadingRenderTransformer({
    status: reading.status,
    statusText: reading.statusText,
    body: reading.body,
  });
};
