/**
 * PURPOSE: Watches a Playwright worker for timers a spec armed and never cleared, and appends what
 * it finds to the file ward names. Reach for this because Playwright is a THIRD process layer that
 * neither of ward's other two detections reaches — jest's `--detectOpenHandles` never runs here,
 * and the timer watch ward arms for a jest worker is armed in a jest worker.
 *
 * USAGE:
 * const harness = openHandleWatchHarness();
 * harness.beforeEach();
 * harness.report({ testPath: testInfo.file });
 * // Appends one JSON line per timer the spec left armed, or nothing when ward did not ask
 */
import { getEnv } from '#gateway/node/process';
import { openHandleReportBroker, openHandleTrackingBroker } from '@dungeonmaster/testing/brokers';

// The same variable the jest side reads. Unset means ward did not ask, and then nothing is patched
// and nothing is written.
const REPORT_PATH_VAR = 'DUNGEONMASTER_OPEN_HANDLE_REPORT';

export const openHandleWatchHarness = (): {
  beforeEach: () => void;
  report: ({ testPath }: { testPath: string }) => void;
} => {
  return {
    beforeEach: (): void => {
      if (getEnv(REPORT_PATH_VAR) === undefined) {
        return;
      }
      openHandleTrackingBroker.watch();
    },

    // Per TEST, not per spec file: a Playwright worker runs many specs in one process, so a report
    // taken once at the end would hand every leak to whichever spec happened to finish last.
    report: ({ testPath }: { testPath: string }): void => {
      const reportPath = getEnv(REPORT_PATH_VAR);
      if (reportPath === undefined) {
        return;
      }
      openHandleReportBroker({ testPath, reportPath });
    },
  };
};
