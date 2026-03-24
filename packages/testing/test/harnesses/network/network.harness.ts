/**
 * PURPOSE: Wraps Playwright network recorder for E2E test harness usage
 *
 * USAGE:
 * const network = networkHarness({ page });
 * // afterEach: await network.dump({ testInfo })
 */
import type { Page, TestInfo } from '@playwright/test';
import { networkRecordPlaywrightBroker } from '../../../src/brokers/network-record/playwright/network-record-playwright-broker';

type RecorderInstance = ReturnType<typeof networkRecordPlaywrightBroker>;

export const networkHarness = ({
  page,
}: {
  page: Page;
}): {
  beforeEach: () => void;
  dump: (params: { testInfo: TestInfo }) => Promise<void>;
  getEntries: RecorderInstance['getEntries'];
  getWsEntries: RecorderInstance['getWsEntries'];
} => {
  let recorder: RecorderInstance | null = null;

  return {
    beforeEach: (): void => {
      recorder = networkRecordPlaywrightBroker({ page });
    },
    dump: async ({ testInfo }: { testInfo: TestInfo }): Promise<void> =>
      recorder!.dump({ testInfo }),
    getEntries: () => recorder!.getEntries(),
    getWsEntries: () => recorder!.getWsEntries(),
  };
};
