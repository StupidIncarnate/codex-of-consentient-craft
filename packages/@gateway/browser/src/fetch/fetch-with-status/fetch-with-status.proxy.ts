import { StartEndpointMock } from '@dungeonmaster/testing';
import type { HttpMethod, RequestCount } from '@dungeonmaster/testing';

// See fetch-json.proxy.ts's own header for why this no longer spies on `globalThis.fetch` directly.
type Endpoint = ReturnType<typeof StartEndpointMock.listen>;

export const fetchWithStatusProxy = (): {
  setupResponse: (params: {
    method?: HttpMethod;
    url: string;
    status: number;
    bodyText: string;
  }) => void;
  // MSW's own real network-error path — no caller-supplied `cause`. Whatever MSW/undici actually
  // rejects with reaches `fetchWithStatus`'s own catch block, which wraps it; the test asserts the
  // real wrapped message.
  setupRefused: (params: { method?: HttpMethod; url: string }) => void;
  // Answers only once released, so a test can assert in-flight UI state before resolving it, or —
  // combined with a real `AbortController.abort()` mid-flight — prove a real abort rather than an
  // invented one.
  setupHeld: (params: { method?: HttpMethod; url: string; bodyText: string }) => {
    release: () => void;
  };
  getRequestBodies: (params: { method?: HttpMethod; url: string }) => Promise<unknown[]>;
  getRequestCount: (params: { method?: HttpMethod; url: string }) => RequestCount;
} => {
  const endpoints = new Map<string, Endpoint>();

  // See fetch-json.proxy.ts's own `endpointFor` comment for why `method` is required-but-optional-typed here.
  const endpointFor = ({
    method,
    url,
  }: {
    method: HttpMethod | undefined;
    url: string;
  }): Endpoint => {
    const resolvedMethod = method ?? 'get';
    const key = `${resolvedMethod} ${url}`;
    const cached = endpoints.get(key);
    if (cached) {
      return cached;
    }
    const endpoint = StartEndpointMock.listen({ method: resolvedMethod, url });
    endpoints.set(key, endpoint);
    return endpoint;
  };

  return {
    setupResponse: ({
      method,
      url,
      status,
      bodyText,
    }: {
      method?: HttpMethod;
      url: string;
      status: number;
      bodyText: string;
    }): void => {
      endpointFor({ method, url }).respondRaw({ status, body: bodyText, headers: {} });
    },
    setupRefused: ({ method, url }: { method?: HttpMethod; url: string }): void => {
      endpointFor({ method, url }).networkError();
    },
    setupHeld: ({
      method,
      url,
      bodyText,
    }: {
      method?: HttpMethod;
      url: string;
      bodyText: string;
    }): { release: () => void } => endpointFor({ method, url }).holdsOpen({ rawBody: bodyText }),
    getRequestBodies: async ({
      method,
      url,
    }: {
      method?: HttpMethod;
      url: string;
    }): Promise<unknown[]> => endpointFor({ method, url }).getRequestBodies(),
    getRequestCount: ({ method, url }: { method?: HttpMethod; url: string }): RequestCount =>
      endpointFor({ method, url }).getRequestCount(),
  };
};
