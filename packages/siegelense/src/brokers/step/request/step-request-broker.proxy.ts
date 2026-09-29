import { fetchWithStatusProxy } from '#gateway/node/fetch/fetch-with-status/fetch-with-status.proxy';

import { requestStatics } from '../../../statics/request/request-statics';

export const stepRequestBrokerProxy = (): {
  setupResponse: (params: {
    url: string;
    status?: number;
    statusText?: string;
    body?: unknown;
  }) => void;
  getRequestSentTo: (params: { url: string }) => {
    method: unknown;
    headers: unknown;
    body: unknown;
  } | null;
} => {
  const fetchProxy = fetchWithStatusProxy();

  return {
    setupResponse: ({
      url,
      status = requestStatics.defaults.status,
      statusText = requestStatics.defaults.statusText,
      body = '',
    }: {
      url: string;
      status?: number;
      statusText?: string;
      body?: unknown;
    }): void => {
      fetchProxy.setupResponse({
        url,
        status,
        statusText,
        bodyText: typeof body === 'string' ? body : JSON.stringify(body),
      });
    },

    getRequestSentTo: ({
      url,
    }: {
      url: string;
    }): { method: unknown; headers: unknown; body: unknown } | null => {
      const init = fetchProxy.getCallsFor({ url }).at(-1)?.[1];
      if (init === null || typeof init !== 'object') {
        return null;
      }
      return {
        method: 'method' in init ? init.method : undefined,
        headers: 'headers' in init ? init.headers : undefined,
        body: 'body' in init ? init.body : undefined,
      };
    },
  };
};
