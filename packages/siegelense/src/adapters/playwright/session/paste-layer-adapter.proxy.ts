// PURPOSE: Builds a fake Page and mocks fs for pasteLayerAdapter tests, exposing
// locator focus calls, keyboard press calls, evaluate calls, and fs staging methods.
// USAGE: const proxy = pasteLayerAdapterProxy(); const { page, getFocusCalls } = proxy.page();

import { existsSync, readFileSync } from 'fs';
import type { Page } from '@playwright/test';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '@dungeonmaster/shared/contracts';

import { refRegistryLayerAdapterProxy } from './ref-registry-layer-adapter.proxy';

export const pasteLayerAdapterProxy = (): {
  page: () => {
    page: Page;
    getFocusCalls: () => readonly unknown[];
    getKeyboardPressCalls: () => readonly unknown[];
    getEvaluateCalls: () => readonly unknown[];
  };
  setupFileExists: (params: { filePath: FilePath; content?: Buffer }) => void;
  setupFileNotFound: (params: { filePath: FilePath }) => void;
} => {
  refRegistryLayerAdapterProxy();

  const existsMock: MockHandle = registerMock({ fn: existsSync });
  const readFileMock: MockHandle = registerMock({ fn: readFileSync });

  existsMock.calledWith([]).returns(false);

  const focusCalls: unknown[] = [];
  const keyboardPressCalls: unknown[] = [];
  const evaluateCalls: unknown[] = [];

  const fakeLocator = (
    selector: unknown,
  ): {
    focus: (options: unknown) => Promise<undefined>;
  } => ({
    focus: async (options: unknown): Promise<undefined> => {
      focusCalls.push({ selector, options });
      return Promise.resolve(undefined);
    },
  });

  const page = {
    locator: (selector: unknown) => fakeLocator(selector),
    keyboard: {
      press: async (key: string): Promise<void> => {
        keyboardPressCalls.push(key);
        return Promise.resolve(undefined);
      },
    },
    evaluate: async (fn: unknown, arg?: unknown): Promise<unknown> => {
      evaluateCalls.push({ fn, arg });
      return Promise.resolve(undefined);
    },
  } as never;

  return {
    page: (): {
      page: Page;
      getFocusCalls: () => readonly unknown[];
      getKeyboardPressCalls: () => readonly unknown[];
      getEvaluateCalls: () => readonly unknown[];
    } => ({
      page,
      getFocusCalls: (): readonly unknown[] => focusCalls,
      getKeyboardPressCalls: (): readonly unknown[] => keyboardPressCalls,
      getEvaluateCalls: (): readonly unknown[] => evaluateCalls,
    }),
    setupFileExists: ({
      filePath,
      content = Buffer.from('test-content'),
    }: {
      filePath: FilePath;
      content?: Buffer;
    }): void => {
      existsMock.calledWith([filePath]).returns(true);
      readFileMock.calledWith([filePath]).returns(content);
    },
    setupFileNotFound: ({ filePath }: { filePath: FilePath }): void => {
      existsMock.calledWith([filePath]).returns(false);
    },
  };
};
