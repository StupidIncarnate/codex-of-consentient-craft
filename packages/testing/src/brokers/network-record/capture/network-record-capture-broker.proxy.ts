import { mswServerAdapterProxy } from '../../../adapters/msw/server/msw-server-adapter.proxy';

export const networkRecordCaptureBrokerProxy = (): Record<PropertyKey, never> => {
  mswServerAdapterProxy();

  return {};
};
