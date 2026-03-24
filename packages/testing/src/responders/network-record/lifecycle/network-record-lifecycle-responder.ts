/**
 * PURPOSE: Creates network recorder instance and returns lifecycle methods for test hook registration
 *
 * USAGE:
 * const recorder = NetworkRecordLifecycleResponder();
 * // Returns { start, afterEach, stop } for use in jest hooks
 */

import { networkRecordCaptureBroker } from '../../../brokers/network-record/capture/network-record-capture-broker';
import { networkLogFormatTransformer } from '../../../transformers/network-log-format/network-log-format-transformer';
import { networkLogStatics } from '../../../statics/network-log/network-log-statics';

export const NetworkRecordLifecycleResponder = (): {
  start: () => void;
  afterEach: () => Promise<void>;
  stop: () => void;
} => {
  const recorder = networkRecordCaptureBroker();

  return {
    start: (): void => {
      recorder.start();
    },
    afterEach: async (): Promise<void> => {
      await recorder.flush();

      const entries = recorder.getEntries();

      if (entries.length > 0) {
        const formatted = networkLogFormatTransformer({ entries, wsEntries: [] });
        process.stderr.write(
          `${networkLogStatics.delimiters.start}\n${formatted}\n${networkLogStatics.delimiters.end}\n`,
        );
      }

      recorder.clear();
    },
    stop: (): void => {
      recorder.stop();
    },
  };
};
