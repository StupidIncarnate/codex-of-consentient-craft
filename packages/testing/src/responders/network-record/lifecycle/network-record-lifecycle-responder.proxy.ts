import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';

import { networkRecordCaptureBrokerProxy } from '../../../brokers/network-record/capture/network-record-capture-broker.proxy';
import { mswServerStateProxy } from '../../../state/msw-server/msw-server-state.proxy';

export const NetworkRecordLifecycleResponderProxy = (): {
  getStderrWrites: () => readonly unknown[];
} => {
  networkRecordCaptureBrokerProxy();
  mswServerStateProxy();
  const stderrChild = stderrProxy();

  return {
    getStderrWrites: (): readonly unknown[] => stderrChild.getWrites(),
  };
};
