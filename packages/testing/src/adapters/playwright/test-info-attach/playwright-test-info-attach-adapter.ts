/**
 * PURPOSE: Wraps Playwright TestInfo.attach() for attaching network log artifacts to test results
 *
 * USAGE:
 * await playwrightTestInfoAttachAdapter({ testInfo, name: 'network-log', body: logContent });
 * // Attaches text content to the test report
 */

import type { TestInfo } from '@playwright/test';

export const playwrightTestInfoAttachAdapter = async ({
  testInfo,
  name,
  body,
}: {
  testInfo: TestInfo;
  name: string;
  body: string;
}): Promise<void> => {
  await testInfo.attach(name, { body, contentType: 'text/plain' });
};
