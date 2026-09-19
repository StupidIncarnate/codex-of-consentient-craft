// PURPOSE: Builds a fake Page whose `setViewportSize` is tracked, exposing the call list
// so a test can assert what viewport dimensions were set.
// USAGE: const proxy = viewportSetLayerAdapterProxy(); const { page, getSetViewportSizeCalls } = proxy.page();

import type { Page } from '@playwright/test';

export const viewportSetLayerAdapterProxy = (): {
  page: () => {
    page: Page;
    getSetViewportSizeCalls: () => readonly unknown[];
  };
} => {
  const setViewportSizeCalls: unknown[] = [];
  const setViewportSize = jest.fn().mockImplementation(async (options: unknown) => {
    setViewportSizeCalls.push(options);
    return Promise.resolve(undefined);
  });

  return {
    page: (): {
      page: Page;
      getSetViewportSizeCalls: () => readonly unknown[];
    } => ({
      page: { setViewportSize } as never,
      getSetViewportSizeCalls: (): readonly unknown[] => setViewportSizeCalls,
    }),
  };
};
