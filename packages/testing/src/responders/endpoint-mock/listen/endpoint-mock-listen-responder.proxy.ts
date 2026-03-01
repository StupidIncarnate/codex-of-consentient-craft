import { mswHttpAdapterProxy } from '../../../adapters/msw/http/msw-http-adapter.proxy';
import { mswServerAdapterProxy } from '../../../adapters/msw/server/msw-server-adapter.proxy';

export const EndpointMockListenResponderProxy = (): Record<PropertyKey, never> => {
  mswHttpAdapterProxy();
  mswServerAdapterProxy();

  return {};
};
