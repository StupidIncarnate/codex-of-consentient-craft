import { StartEndpointMock } from '@dungeonmaster/testing';
import type { HttpMethod } from '@dungeonmaster/testing';

// A raw `registerSpyOn({ object: globalThis, method: 'fetch' })` (this file's own previous shape)
// replaces the ONE shared `globalThis.fetch` handle for the whole test file, throwing on any call
// an unrelated, still-MSW-based sibling proxy makes in that same file. Routing through
// `StartEndpointMock.listen()` instead means this proxy registers its own MSW handler and leaves
// `globalThis.fetch` itself untouched, so it coexists with any other proxy staging HTTP the same
// way.
type Endpoint = ReturnType<typeof StartEndpointMock.listen>;

export const fetchJsonProxy = (): {
  setupSuccess: (params: { method?: HttpMethod; url: string; body: unknown }) => void;
  setupNotOk: (params: {
    method?: HttpMethod;
    url: string;
    status: number;
    bodyText: string;
  }) => void;
  setupInvalidJson: (params: { method?: HttpMethod; url: string; bodyText: string }) => void;
  setupEmptyBody: (params: { method?: HttpMethod; url: string }) => void;
  setupConnectionRefused: (params: { method?: HttpMethod; url: string }) => void;
  getRequestBodies: (params: { method?: HttpMethod; url: string }) => Promise<unknown[]>;
  getRequestCount: (params: { method?: HttpMethod; url: string }) => number;
} => {
  const endpoints = new Map<string, Endpoint>();

  // One MSW handler per distinct (method, url) address — a second setup call against the same
  // address reuses the handler already registered rather than layering a duplicate on top of it.
  // `method` is a REQUIRED key here, typed `HttpMethod | undefined` rather than `method?:` —
  // every call site below passes a local var already typed `HttpMethod | undefined` (from an
  // optional public param), and `exactOptionalPropertyTypes` refuses an explicit `undefined` value
  // against a truly optional property.
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
    setupSuccess: ({
      method,
      url,
      body,
    }: {
      method?: HttpMethod;
      url: string;
      body: unknown;
    }): void => {
      endpointFor({ method, url }).resolves({ data: body });
    },
    setupNotOk: ({
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
    setupInvalidJson: ({
      method,
      url,
      bodyText,
    }: {
      method?: HttpMethod;
      url: string;
      bodyText: string;
    }): void => {
      endpointFor({ method, url }).respondRaw({ status: 200, body: bodyText, headers: {} });
    },
    setupEmptyBody: ({ method, url }: { method?: HttpMethod; url: string }): void => {
      endpointFor({ method, url }).respondRaw({ status: 200, body: '', headers: {} });
    },
    // MSW's own real network-error path — no invented `Error` shape. `fetchJson` never catches a
    // rejection from `globalThis.fetch`, so whatever MSW/undici actually throws here propagates to
    // the caller unwrapped.
    setupConnectionRefused: ({ method, url }: { method?: HttpMethod; url: string }): void => {
      endpointFor({ method, url }).networkError();
    },
    getRequestBodies: async ({
      method,
      url,
    }: {
      method?: HttpMethod;
      url: string;
    }): Promise<unknown[]> => endpointFor({ method, url }).getRequestBodies(),
    getRequestCount: ({ method, url }: { method?: HttpMethod; url: string }): number =>
      endpointFor({ method, url }).getRequestCount(),
  };
};
