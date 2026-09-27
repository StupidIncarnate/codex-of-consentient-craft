import { mswServerAdapterProxy } from '../../../adapters/msw/server/msw-server-adapter.proxy';
import { mswWsAdapterProxy } from '../../../adapters/msw/ws/msw-ws-adapter.proxy';

export const EndpointMockSetupResponderProxy = (): Record<PropertyKey, never> => {
  mswServerAdapterProxy();
  mswWsAdapterProxy();

  return {};
};
