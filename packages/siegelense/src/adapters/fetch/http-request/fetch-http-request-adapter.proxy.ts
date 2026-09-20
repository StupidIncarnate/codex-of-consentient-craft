import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { requestStatics } from '../../../statics/request/request-statics';

export const fetchHttpRequestAdapterProxy = (): {
  setupResponse: (params: {
    url: string;
    status?: number;
    statusText?: string;
    headers?: Record<PropertyKey, unknown>;
    body?: unknown;
  }) => void;
  setupRejection: (params: { url: string; error: Error }) => void;
} => {
  const handle = registerSpyOn({ object: globalThis, method: 'fetch' });

  return {
    setupResponse: ({
      url,
      status = requestStatics.defaults.status,
      statusText = requestStatics.defaults.statusText,
      headers = {},
      body = '',
    }: {
      url: string;
      status?: number;
      statusText?: string;
      headers?: Record<PropertyKey, unknown>;
      body?: unknown;
    }): void => {
      const responseText = typeof body === 'string' ? body : JSON.stringify(body);
      const mockResponse = {
        status,
        statusText,
        headers: {
          forEach: (callback: (val: unknown, key: PropertyKey) => void): void => {
            Object.entries(headers).forEach(([key, val]) => {
              callback(val, key);
            });
          },
        },
        text: async (): Promise<unknown> => Promise.resolve(responseText),
      };

      handle.calledWith([url]).resolves(mockResponse as never);
    },

    setupRejection: ({ url, error }: { url: string; error: Error }): void => {
      handle.calledWith([url]).rejects(error);
    },
  };
};
