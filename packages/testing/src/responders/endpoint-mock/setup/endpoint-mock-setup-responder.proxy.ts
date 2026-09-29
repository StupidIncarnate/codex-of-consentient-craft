import { mswServerStateProxy } from '../../../state/msw-server/msw-server-state.proxy';

export const EndpointMockSetupResponderProxy = (): Record<PropertyKey, never> => {
  mswServerStateProxy();

  return {};
};
