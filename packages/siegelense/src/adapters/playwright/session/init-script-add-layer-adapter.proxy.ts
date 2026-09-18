// PURPOSE: Builds a fake Page whose `addInitScript` is tracked, exposing the call list
// so a test can assert what init scripts were installed.
// USAGE: const proxy = initScriptAddLayerAdapterProxy(); const { page, getAddInitScriptCalls } = proxy.page();

import type { Page } from '@playwright/test';

export const initScriptAddLayerAdapterProxy = (): {
  page: () => {
    page: Page;
    getAddInitScriptCalls: () => readonly unknown[];
  };
} => {
  const addInitScriptCalls: unknown[] = [];
  const addInitScript = jest.fn().mockImplementation(async (options: unknown) => {
    addInitScriptCalls.push(options);
    return Promise.resolve(undefined);
  });

  return {
    page: (): {
      page: Page;
      getAddInitScriptCalls: () => readonly unknown[];
    } => ({
      page: { addInitScript } as never,
      getAddInitScriptCalls: (): readonly unknown[] => addInitScriptCalls,
    }),
  };
};
