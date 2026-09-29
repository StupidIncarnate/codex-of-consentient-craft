import { networkRecordCaptureBrokerProxy } from '../../../brokers/network-record/capture/network-record-capture-broker.proxy';
import { mswServerStateProxy } from '../../../state/msw-server/msw-server-state.proxy';

export const NetworkRecordLifecycleResponderProxy = (): Record<PropertyKey, never> => {
  networkRecordCaptureBrokerProxy();
  mswServerStateProxy();

  return {};
};
