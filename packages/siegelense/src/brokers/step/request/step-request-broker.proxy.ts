import { fetchHttpRequestAdapterProxy } from '../../../adapters/fetch/http-request/fetch-http-request-adapter.proxy';

export const stepRequestBrokerProxy = (): {
  setupResponse: (params: {
    url: string;
    status?: number;
    statusText?: string;
    headers?: Record<PropertyKey, unknown>;
    body?: unknown;
  }) => void;
  setupRejection: (params: { url: string; error: Error }) => void;
} => {
  const fetchProxy = fetchHttpRequestAdapterProxy();

  return {
    setupResponse: fetchProxy.setupResponse,
    setupRejection: fetchProxy.setupRejection,
  };
};
