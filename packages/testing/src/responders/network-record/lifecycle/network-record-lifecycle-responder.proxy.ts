import { networkRecordCaptureBrokerProxy } from '../../../brokers/network-record/capture/network-record-capture-broker.proxy';

export const NetworkRecordLifecycleResponderProxy = (): Record<PropertyKey, never> => {
  networkRecordCaptureBrokerProxy();

  return {};
};
