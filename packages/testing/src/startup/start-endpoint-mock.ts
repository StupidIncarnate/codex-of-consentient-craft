/**
 * PURPOSE: Provides centralized HTTP mocking for tests via MSW, replacing direct fetch mocking in proxy files
 *
 * USAGE:
 * const endpoint = StartEndpointMock.listen({ method: 'get', url: '/api/projects' });
 * endpoint.resolves({ data: [{ id: '123', name: 'My Project' }] });
 */

import { http, HttpResponse, type DefaultBodyType } from 'msw';

import { mswServerAdapter } from '../adapters/msw/server/msw-server-adapter';
import type {
  EndpointControl,
  HttpMethod,
} from '../contracts/endpoint-control/endpoint-control-contract';

const INTERNAL_SERVER_ERROR = 500;

export const StartEndpointMock = {
  listen: ({ method, url }: { method: HttpMethod; url: string }): EndpointControl => {
    const server = mswServerAdapter();
    // MSW handlers need absolute URLs in Node/jsdom - resolve relative paths against localhost
    const handlerUrl = url.startsWith('/') ? `http://localhost${url}` : url;

    server.use(
      http[method](handlerUrl, () =>
        HttpResponse.json(
          {
            error: `StartEndpointMock: No response configured for ${method.toUpperCase()} ${handlerUrl}`,
          },
          { status: INTERNAL_SERVER_ERROR },
        ),
      ),
    );

    return {
      resolves: ({ data }: { data: unknown }): void => {
        server.use(http[method](handlerUrl, () => HttpResponse.json(data as DefaultBodyType)));
      },

      responds: ({ status, body }: { status: number; body?: unknown }): void => {
        server.use(
          http[method](handlerUrl, () =>
            body === undefined
              ? new HttpResponse(null, { status })
              : HttpResponse.json(body as DefaultBodyType, { status }),
          ),
        );
      },

      respondRaw: ({
        status,
        body,
        headers,
      }: {
        status: number;
        body: BodyInit | null;
        headers: Record<string, string>;
      }): void => {
        server.use(http[method](handlerUrl, () => new HttpResponse(body, { status, headers })));
      },

      networkError: (): void => {
        server.use(http[method](handlerUrl, () => HttpResponse.error()));
      },
    };
  },
};
