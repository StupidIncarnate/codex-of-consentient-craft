import { mswServerAdapterProxy } from '../../../adapters/msw/server/msw-server-adapter.proxy';

export const EndpointMockSetupResponderProxy = (): Record<PropertyKey, never> => {
  mswServerAdapterProxy();

  return {};
};
