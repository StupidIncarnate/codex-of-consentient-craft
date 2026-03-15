/**
 * PURPOSE: Registers an MSW HTTP handler for a given method/URL and returns an EndpointControl object for configuring mock responses
 *
 * USAGE:
 * const control = EndpointMockListenResponder({ method: 'get', url: '/api/guilds' });
 * control.resolves({ data: [{ id: '123' }] });
 */

import { mswHttpAdapter } from '../../../adapters/msw/http/msw-http-adapter';
import { mswServerAdapter } from '../../../adapters/msw/server/msw-server-adapter';
import { requestCountContract } from '../../../contracts/request-count/request-count-contract';
import type { RequestCount } from '../../../contracts/request-count/request-count-contract';
import type {
  EndpointControl,
  HttpMethod,
} from '../../../contracts/endpoint-control/endpoint-control-contract';

const INTERNAL_SERVER_ERROR = 500;

export const EndpointMockListenResponder = ({
  method,
  url,
}: {
  method: HttpMethod;
  url: string;
}): EndpointControl => {
  const server = mswServerAdapter();
  const { http, HttpResponse } = mswHttpAdapter();
  // MSW handlers need absolute URLs in Node/jsdom - resolve relative paths against localhost
  const handlerUrl = url.startsWith('/') ? `http://localhost${url}` : url;
  const requestLog: true[] = [];

  server.use(
    http[method](handlerUrl, () => {
      requestLog.push(true);
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
      server.use(
        http[method](handlerUrl, () => {
          requestLog.push(true);
          return HttpResponse.json(data as never);
        }),
      );
    },

    responds: ({ status, body }: { status: number; body?: unknown }): void => {
      server.use(
        http[method](handlerUrl, () => {
          requestLog.push(true);
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
        http[method](handlerUrl, () => {
          requestLog.push(true);
          return new HttpResponse(body, { status, headers });
        }),
      );
    },

    networkError: (): void => {
      server.use(
        http[method](handlerUrl, () => {
          requestLog.push(true);
          return HttpResponse.error();
        }),
      );
    },

    getRequestCount: (): RequestCount => requestCountContract.parse(requestLog.length),
  };
};
