/**
 * PURPOSE: Proxy for open-handle-report-broker testing
 *
 * USAGE:
 * const proxy = openHandleReportBrokerProxy();
 * proxy.getAppended();
 * // Returns every [filePath, content] pair the broker appended
 */

import { fsAppendFileAdapterProxy } from '../../../adapters/fs/append-file/fs-append-file-adapter.proxy';
import { openHandleTrackingBrokerProxy } from '../tracking/open-handle-tracking-broker.proxy';
import type { RecordedCalls } from '../../../register-mock';

export const openHandleReportBrokerProxy = (): {
  getAppended: () => RecordedCalls;
} => {
  const appendProxy = fsAppendFileAdapterProxy();
  openHandleTrackingBrokerProxy();

  return {
    getAppended: (): RecordedCalls => appendProxy.getCallArgs(),
  };
};
