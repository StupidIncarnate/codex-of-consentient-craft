/**
 * PURPOSE: Registers an MSW HTTP handler for a given method/URL and returns an EndpointControl object for configuring mock responses
 *
 * USAGE:
 * const control = EndpointMockListenResponder({ method: 'get', url: '/api/guilds' });
 * control.resolves({ data: [{ id: '123' }] });
 */

import { http, HttpResponse } from '#gateway/npm/msw';
import { mswServerState } from '../../../state/msw-server/msw-server-state';
import type {
  EndpointControl,
  EndpointResponseContract,
  HttpMethod,
} from '../../../contracts/endpoint-control/endpoint-control-contract';

const INTERNAL_SERVER_ERROR = 500;

export const EndpointMockListenResponder = ({
  method,
  url,
  contract,
}: {
  method: HttpMethod;
  url: string;
  contract?: EndpointResponseContract;
}): EndpointControl => {
  const server = mswServerState.get();
  // MSW handlers need absolute URLs in Node/jsdom - resolve relative paths against localhost
  const handlerUrl = url.startsWith('/') ? `http://localhost${url}` : url;
  // One entry per received request, holding its parsed JSON body. Every handler CLONES the request
  // before reading: MSW hands over a single-use body stream, and consuming it here would leave
  // nothing for the response path. A body that is not JSON (respondRaw endpoints, bodyless GETs)
  // is recorded AS its parse error rather than dropped, so nothing is silently swallowed and a
  // caller inspecting the log can see why a body is missing. The capture is repeated per handler
  // rather than factored out because nested function declarations are forbidden here.
  const requestLog: Promise<unknown>[] = [];

  server.use(
    http[method](handlerUrl, ({ request }) => {
      requestLog.push(
        request
          .clone()
          .json()
          .catch((error: unknown) => ({ bodyParseError: String(error) })),
      );
      return HttpResponse.json(
        {
          error: `StartEndpointMock: No response configured for ${method.toUpperCase()} ${handlerUrl}`,
        },
        { status: INTERNAL_SERVER_ERROR },
      );
    }),
  );

  return {
    resolves: ({ data }: { data: unknown }): void => {
      // Parsed BEFORE `server.use` registers the handler, so a response the contract rejects
      // throws here, at staging time, rather than surfacing as a 500 the first time a test fetches.
      const body = contract ? contract.parse(data) : data;

      server.use(
        http[method](handlerUrl, ({ request }) => {
          requestLog.push(
            request
              .clone()
              .json()
              .catch((error: unknown) => ({ bodyParseError: String(error) })),
          );
          return HttpResponse.json(body as never);
        }),
      );
    },

    responds: ({ status, body }: { status: number; body?: unknown }): void => {
      server.use(
        http[method](handlerUrl, ({ request }) => {
          requestLog.push(
            request
              .clone()
              .json()
              .catch((error: unknown) => ({ bodyParseError: String(error) })),
          );
          return body === undefined
            ? new HttpResponse(null, { status })
            : HttpResponse.json(body as never, { status });
        }),
      );
    },

    respondRaw: ({
      status,
      body,
      headers,
    }: {
      status: number;
      body: BodyInit | null;
      headers: Record<PropertyKey, string>;
    }): void => {
      server.use(
        http[method](handlerUrl, ({ request }) => {
          requestLog.push(
            request
              .clone()
              .json()
              .catch((error: unknown) => ({ bodyParseError: String(error) })),
          );
          return new HttpResponse(body, { status, headers });
        }),
      );
    },

    networkError: (): void => {
      server.use(
        http[method](handlerUrl, ({ request }) => {
          requestLog.push(
            request
              .clone()
              .json()
              .catch((error: unknown) => ({ bodyParseError: String(error) })),
          );
          return HttpResponse.error();
        }),
      );
    },

    holdsOpen: ({
      data,
      rawBody,
    }: {
      data?: unknown;
      rawBody?: string;
    }): { release: () => void } => {
      // Resolver lives on an object property, not a `let`, so nothing here is reassigned by name -
      // only `gate.resolve` is overwritten, once, by the Promise constructor's own callback.
      const gate: { resolve: () => void } = { resolve: (): void => undefined };
      const opened = new Promise<void>((resolve) => {
        gate.resolve = resolve;
      });

      server.use(
        http[method](handlerUrl, async ({ request }) => {
          requestLog.push(
            request
              .clone()
              .json()
              .catch((error: unknown) => ({ bodyParseError: String(error) })),
          );
          await opened;
          // `rawBody` is answered verbatim; `data` (the default) is JSON-encoded.
          return rawBody === undefined
            ? HttpResponse.json(data as never)
            : new HttpResponse(rawBody);
        }),
      );

      return {
        release: (): void => {
          gate.resolve();
        },
      };
    },

    getRequestCount: (): number => requestLog.length,

    getRequestBodies: async (): Promise<unknown[]> => Promise.all(requestLog),
  };
};
