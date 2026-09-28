/**
 * PURPOSE: Proxy for open-handle-report-broker testing
 *
 * USAGE:
 * const proxy = openHandleReportBrokerProxy();
 * proxy.setupReportFile({ reportPath: '/tmp/handles.jsonl' });
 * proxy.getAppended({ reportPath: '/tmp/handles.jsonl' });
 * // Returns the text of every append made to that path
 */

import { appendFileSyncProxy } from '#gateway/node/fs/append-file-sync/append-file-sync.proxy';
import { openHandleTrackingBrokerProxy } from '../tracking/open-handle-tracking-broker.proxy';

export const openHandleReportBrokerProxy = (): {
  setupReportFile: ({ reportPath }: { reportPath: string }) => void;
  getAppended: ({ reportPath }: { reportPath: string }) => readonly unknown[];
} => {
  const appendProxy = appendFileSyncProxy();
  openHandleTrackingBrokerProxy();

  return {
    setupReportFile: ({ reportPath }: { reportPath: string }): void => {
      appendProxy.succeeds({ path: reportPath });
    },
    getAppended: ({ reportPath }: { reportPath: string }): readonly unknown[] =>
      appendProxy.calls({ path: reportPath }).map(([, contents]) => contents),
  };
};
