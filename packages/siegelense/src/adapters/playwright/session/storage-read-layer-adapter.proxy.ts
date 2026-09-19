// PURPOSE: Builds a fake Page whose `evaluate` is tracked, exposing the call list and staged
// result so a test can assert what prefix was evaluated and receive a StorageReading.
// USAGE: const proxy = storageReadLayerAdapterProxy(); const { page, getEvaluateCalls } = proxy.page();

import type { Page } from '@playwright/test';

export const storageReadLayerAdapterProxy = (): {
  page: (params?: { result?: unknown }) => {
    page: Page;
    getEvaluateCalls: () => readonly unknown[];
  };
} => {
  const evaluateCalls: unknown[] = [];
  const state = {
    stagedResult: {
      origin: 'http://localhost:3000',
      local: {},
      session: {},
    } as unknown,
  };

  const evaluate = jest.fn().mockImplementation(async (fn: unknown, arg: unknown) => {
    evaluateCalls.push({ fn, arg });
    return Promise.resolve(state.stagedResult);
  });

  return {
    page: (params?: {
      result?: unknown;
    }): {
      page: Page;
      getEvaluateCalls: () => readonly unknown[];
    } => {
      if (params?.result !== undefined) {
        state.stagedResult = params.result;
      }
      return {
        page: { evaluate } as never,
        getEvaluateCalls: (): readonly unknown[] => evaluateCalls,
      };
    },
  };
};
