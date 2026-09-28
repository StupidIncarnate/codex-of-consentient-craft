import { StartEndpointMock } from '@dungeonmaster/testing';
import type { RequestCount } from '@dungeonmaster/testing';

// Stages through MSW's XHR interceptor, the same mechanism the fetch proxies use for `fetch`, so a
// file mixing both stays on one staging path. MSW itself emits the upload `progress` event, with
// loaded and total both the request body's byte length; readings are not scripted. Nothing answers
// a url no `setup*` call named: MSW fails the test on an unhandled request.
type Endpoint = ReturnType<typeof StartEndpointMock.listen>;

export const xhrPostWithProgressProxy = (): {
  setupResponse: (params: { url: string; status: number; bodyText: string }) => void;
  setupRefused: (params: { url: string }) => void;
  getRequestBodies: (params: { url: string }) => Promise<unknown[]>;
  getRequestCount: (params: { url: string }) => RequestCount;
} => {
  const endpoints = new Map<string, Endpoint>();

  const endpointFor = ({ url }: { url: string }): Endpoint => {
    const cached = endpoints.get(url);
    if (cached) {
      return cached;
    }
    const endpoint = StartEndpointMock.listen({ method: 'post', url });
    endpoints.set(url, endpoint);
    return endpoint;
  };

  return {
    setupResponse: ({
      url,
      status,
      bodyText,
    }: {
      url: string;
      status: number;
      bodyText: string;
    }): void => {
      endpointFor({ url }).respondRaw({ status, body: bodyText, headers: {} });
    },
    setupRefused: ({ url }: { url: string }): void => {
      endpointFor({ url }).networkError();
    },
    getRequestBodies: async ({ url }: { url: string }): Promise<unknown[]> =>
      endpointFor({ url }).getRequestBodies(),
    getRequestCount: ({ url }: { url: string }): RequestCount =>
      endpointFor({ url }).getRequestCount(),
  };
};
