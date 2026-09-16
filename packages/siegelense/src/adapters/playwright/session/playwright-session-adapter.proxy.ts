import { EventEmitter } from 'events';

import { chromium } from '@playwright/test';
import { registerModuleMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { listenersLayerAdapterProxy } from './listeners-layer-adapter.proxy';

// The one thing this proxy mocks over the npm boundary: `chromium.launch`, staged on its launch
// options object. Everything hanging off the fake `Browser`/`BrowserContext`/`Page` it resolves to
// is a plain object this proxy builds itself — there is no real browser in a unit test, so nothing
// beyond `chromium.launch` is a boundary to mock. Every method on that fake object is invisible to
// the adapter's own type-checking (TypeScript checks the adapter against Playwright's real .d.ts;
// only the mocked RUNTIME value comes from here), so its internal shapes stay untyped by design.
const FIXED_EPOCH_MS = 1_700_000_000_000;

export const playwrightSessionAdapterProxy = (): {
  setLocatorCount: (params: { selector: string; count: number }) => void;
  setDescribeMatchesResult: (params: { raw: readonly unknown[] }) => void;
  setNearestNamesResult: (params: { raw: readonly unknown[] }) => void;
  setEvaluateSourceResult: (params: { result: unknown }) => void;
  getScreenshotCalls: () => readonly unknown[];
  getClickCalls: () => readonly unknown[];
  getFillCalls: () => readonly unknown[];
  getWaitForCalls: () => readonly unknown[];
  setResponseTextThrows: () => void;
  emitConsoleMessage: (params: { type: string; text: string; url: string; line: number }) => void;
  emitPageError: (params: { name: string; message: string; stack: string | undefined }) => void;
  emitResponse: (params: {
    method: string;
    url: string;
    resourceType: string;
    status: number;
    requestBody: string | null;
    responseText: string;
  }) => Promise<void>;
  emitRequestFailed: (params: {
    method: string;
    url: string;
    resourceType: string;
    requestBody: string | null;
    errorText: string;
  }) => void;
  emitWebsocket: (params: { url: string }) => {
    frameSent: (params: { payload: string }) => void;
    frameReceived: (params: { payload: string }) => void;
    close: () => void;
  };
} => {
  // listenersLayerAdapter is pure (no npm boundary of its own), so its proxy is empty — called
  // here only to satisfy enforce-proxy-child-creation, since this file's implementation imports it.
  listenersLayerAdapterProxy();

  registerSpyOn({ object: Date, method: 'now' }).calledWith([]).returns(FIXED_EPOCH_MS);

  const state = {
    locatorCounts: new Map<unknown, unknown>(),
    describeMatchesRaw: [] as unknown,
    nearestNamesRaw: [] as unknown,
    evaluateSourceResult: undefined as unknown,
    responseTextThrows: false,
    screenshotCalls: [] as unknown[],
    clickCalls: [] as unknown[],
    fillCalls: [] as unknown[],
    waitForCalls: [] as unknown[],
  };

  // Keyed on the selector string `page.locator(...)` actually received — the same string
  // `countMatches`/`clickMatch`/`fillMatch`/`waitForMatch` compose from `within` and `target`. A
  // broken composition sends a different string here, so `count()` misses the staged entry (falls
  // back to 0) and click/fill/waitFor record a call against a selector the test never described.
  const buildFakeLocator = ({
    selector,
  }: {
    selector: string;
  }): {
    count: () => Promise<unknown>;
    click: (options: unknown) => Promise<undefined>;
    fill: (value: unknown, options: unknown) => Promise<undefined>;
    waitFor: (options: unknown) => Promise<undefined>;
  } => ({
    count: async (): Promise<unknown> => Promise.resolve(state.locatorCounts.get(selector) ?? 0),
    click: async (options: unknown): Promise<undefined> => {
      state.clickCalls.push({ selector, options });
      return Promise.resolve(undefined);
    },
    fill: async (value: unknown, options: unknown): Promise<undefined> => {
      state.fillCalls.push({ selector, value, options });
      return Promise.resolve(undefined);
    },
    waitFor: async (options: unknown): Promise<undefined> => {
      state.waitForCalls.push({ selector, options });
      return Promise.resolve(undefined);
    },
  });

  const page = Object.assign(new EventEmitter(), {
    locator: (selector: string) => buildFakeLocator({ selector }),
    evaluate: async (_source: unknown, arg?: unknown) => {
      if (arg === undefined) {
        return Promise.resolve(state.evaluateSourceResult);
      }
      if (arg === null) {
        return Promise.resolve(state.nearestNamesRaw);
      }
      return Promise.resolve(state.describeMatchesRaw);
    },
    screenshot: async (options: unknown) => {
      state.screenshotCalls.push(options);
      return Promise.resolve(undefined);
    },
    goto: async () => Promise.resolve(undefined),
  });

  const context = {
    grantPermissions: async () => Promise.resolve(undefined),
    newPage: async () => Promise.resolve(page),
  };

  const browser = {
    newContext: async () => Promise.resolve(context),
    close: async () => Promise.resolve(undefined),
  };

  // registerModuleMock over registerMock: `chromium.launch` is a real Playwright class method
  // (implicit `this`), so extracting it as a value for `registerMock({ fn: chromium.launch })`
  // trips @typescript-eslint/unbound-method — and every fix that avoids the literal member
  // expression (a computed-key read, a `this: void` cast) also breaks registerMock's own transform,
  // which matches that literal expression to wire up the adapter's call site. Replacing the whole
  // module instead needs no extracted reference: `chromium.launch` is only ever called directly
  // here (`.mockResolvedValue`), never detached from its receiver.
  registerModuleMock({
    module: '@playwright/test',
    factory: () => ({ chromium: { launch: jest.fn() } }),
  });
  (chromium.launch as unknown as jest.Mock).mockResolvedValue(browser);

  return {
    setLocatorCount: ({ selector, count }): void => {
      state.locatorCounts.set(selector, count);
    },
    setDescribeMatchesResult: ({ raw }): void => {
      state.describeMatchesRaw = raw;
    },
    setNearestNamesResult: ({ raw }): void => {
      state.nearestNamesRaw = raw;
    },
    setEvaluateSourceResult: ({ result }): void => {
      state.evaluateSourceResult = result;
    },
    getScreenshotCalls: (): readonly unknown[] => state.screenshotCalls,
    getClickCalls: (): readonly unknown[] => state.clickCalls,
    getFillCalls: (): readonly unknown[] => state.fillCalls,
    getWaitForCalls: (): readonly unknown[] => state.waitForCalls,
    setResponseTextThrows: (): void => {
      state.responseTextThrows = true;
    },
    emitConsoleMessage: ({ type, text, url, line }): void => {
      page.emit('console', {
        type: () => type,
        text: () => text,
        location: () => ({ url, lineNumber: line }),
      });
    },
    emitPageError: ({ name, message, stack }): void => {
      const error = new Error(message);
      error.name = name;
      if (stack !== undefined) {
        error.stack = stack;
      }
      page.emit('pageerror', error);
    },
    emitResponse: async ({ method, url, resourceType, status, requestBody, responseText }) => {
      const request = {
        method: () => method,
        url: () => url,
        resourceType: () => resourceType,
        postData: () => requestBody,
      };
      const response = {
        request: () => request,
        status: () => status,
        text: async () =>
          state.responseTextThrows
            ? Promise.reject(new Error('text() must not be called for a skipped resource type'))
            : Promise.resolve(responseText),
      };
      page.emit('response', response);
      // The response handler reads its body through a fire-and-forget promise chain. A macrotask
      // flush lets every pending microtask in that chain settle before a test reads the buffer.
      await new Promise((resolve) => {
        setImmediate(resolve);
      });
    },
    emitRequestFailed: ({ method, url, resourceType, requestBody, errorText }): void => {
      const request = {
        method: () => method,
        url: () => url,
        resourceType: () => resourceType,
        postData: () => requestBody,
        failure: () => ({ errorText }),
      };
      page.emit('requestfailed', request);
    },
    emitWebsocket: ({ url }) => {
      const socket = Object.assign(new EventEmitter(), { url: () => url });
      page.emit('websocket', socket);
      return {
        frameSent: ({ payload }: { payload: string }): void => {
          socket.emit('framesent', { payload });
        },
        frameReceived: ({ payload }: { payload: string }): void => {
          socket.emit('framereceived', { payload });
        },
        close: (): void => {
          socket.emit('close');
        },
      };
    },
  };
};
