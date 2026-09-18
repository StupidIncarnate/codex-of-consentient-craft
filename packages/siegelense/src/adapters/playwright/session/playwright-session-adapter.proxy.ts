import { EventEmitter } from 'events';

import { chromium } from '@playwright/test';
import { registerModuleMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { domReadLayerAdapterProxy } from './dom-read-layer-adapter.proxy';
import { keyPressLayerAdapterProxy } from './key-press-layer-adapter.proxy';
import { keyReadLayerAdapterProxy } from './key-read-layer-adapter.proxy';
import { listenersLayerAdapterProxy } from './listeners-layer-adapter.proxy';
import { refRegistryLayerAdapterProxy } from './ref-registry-layer-adapter.proxy';
import { rootCheckLayerAdapterProxy } from './root-check-layer-adapter.proxy';
import { RawDomReadingStub } from '../../../contracts/raw-dom-reading/raw-dom-reading.stub';

// The one thing this proxy mocks over the npm boundary: `chromium.launch`, staged on its launch
// options object. Everything hanging off the fake `Browser`/`BrowserContext`/`Page` it resolves to
// is a plain object this proxy builds itself — there is no real browser in a unit test, so nothing
// beyond `chromium.launch` is a boundary to mock. Every method on that fake object is invisible to
// the adapter's own type-checking (TypeScript checks the adapter against Playwright's real .d.ts;
// only the mocked RUNTIME value comes from here), so its internal shapes stay untyped by design.
const FIXED_EPOCH_MS = 1_700_000_000_000;

// The literal substring `describeMatches` and `nearestNames` feed to `page.evaluate` when they
// self-invoke — how the fake below tells the two staged results apart once neither call passes a
// second `evaluate()` argument any more (see the note on `evaluate` itself for why that argument is
// gone).
const NEAREST_NAMES_MARKER = "querySelectorAll('[data-testid]')";
const DESCRIBE_MATCHES_MARKER = 'getBoundingClientRect';
// The key reader's source ALSO calls getBoundingClientRect, so it is matched first and on a phrase
// only it carries. Order is load-bearing here: swap the two and every `look` would be answered with
// the staged describeMatches rows.
const KEY_READ_MARKER = 'hasContentDescendant';
const DOM_READ_MARKER = 'childElementCount';
const KEY_PRESS_MARKER = 'document.activeElement';
const REF_STATE_MARKER = 'isConnected === true ?';
const STAMP_MARKER = "setAttribute('siege-target'";
const UNSTAMP_MARKER = "removeAttribute('siege-target')";
const BOX_MARKER = 'getComputedStyle';
const ROOT_CHECK_MARKER = 'document.querySelector("#root")';

export const playwrightSessionAdapterProxy = (): {
  setLocatorCount: (params: { selector: string; count: number }) => void;
  setDescribeMatchesResult: (params: { raw: readonly unknown[] }) => void;
  setNearestNamesResult: (params: { raw: readonly unknown[] }) => void;
  setKeyReadResult: (params: { raw: unknown }) => void;
  setDomReadResult: (params: { raw: unknown }) => void;
  setRefState: (params: { state: string }) => void;
  setBoxResult: (params: { raw: unknown }) => void;
  setEvaluateSourceResult: (params: { result: unknown }) => void;
  setFocusedResult: (params: { raw: unknown }) => void;
  setRootPresent: (params: { present: boolean }) => void;
  getInitScripts: () => readonly unknown[];
  getStampCalls: () => readonly unknown[];
  getScreenshotCalls: () => readonly unknown[];
  getClickCalls: () => readonly unknown[];
  getFillCalls: () => readonly unknown[];
  getKeyboardPressCalls: () => readonly unknown[];
  getWaitForCalls: () => readonly unknown[];
  getWaitForFunctionCalls: () => readonly unknown[];
  setWaitForFunctionRejects: () => void;
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
  // Each of these three layer adapters is pure (no npm boundary of its own), so its proxy is empty
  // — called here only to satisfy enforce-proxy-child-creation, since this file's implementation
  // imports all three.
  listenersLayerAdapterProxy();
  keyPressLayerAdapterProxy();
  keyReadLayerAdapterProxy();
  refRegistryLayerAdapterProxy();
  domReadLayerAdapterProxy();
  rootCheckLayerAdapterProxy();

  registerSpyOn({ object: Date, method: 'now' }).calledWith([]).returns(FIXED_EPOCH_MS);

  const state = {
    locatorCounts: new Map<unknown, unknown>(),
    describeMatchesRaw: [] as unknown,
    nearestNamesRaw: [] as unknown,
    keyReadRaw: { rows: [], highestRef: 0, skipped: [] } as unknown,
    domReadRaw: RawDomReadingStub() as unknown,
    focusedRaw: null as unknown,
    rootPresent: true,
    keyboardPressCalls: [] as unknown[],
    refState: 'live',
    boxRaw: {
      ref: 26,
      x: 607,
      y: 472,
      width: 66,
      height: 27,
      viewport: { width: 1280, height: 720 },
      visible: true,
      inViewport: true,
    } as unknown,
    evaluateSourceResult: undefined as unknown,
    responseTextThrows: false,
    initScripts: [] as unknown[],
    stampCalls: [] as unknown[],
    screenshotCalls: [] as unknown[],
    clickCalls: [] as unknown[],
    fillCalls: [] as unknown[],
    waitForCalls: [] as unknown[],
    waitForFunctionCalls: [] as unknown[],
    waitForFunctionRejects: false,
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
    keyboard: {
      press: async (key: string): Promise<void> => {
        state.keyboardPressCalls.push(key);
        return Promise.resolve(undefined);
      },
    },
    // Real Playwright's client tags every `evaluate()` call with `isFunction: typeof pageFunction
    // === 'function'` (playwright-core lib/client/jsHandle.js), and its browser-side utility script
    // (lib/generated/utilityScriptSource.js `evaluate()`) applies the second argument ONLY when that
    // flag is true — handed a STRING it `eval`s the bare expression and never calls the result with
    // `arg`, so a caller relying on Playwright to thread `arg` into a string source gets back
    // whatever an un-called function serializes to: `undefined`. A fake that shortcuts straight to
    // the staged result regardless of this shape can never fail the way the real thing does, so it
    // is modelled here instead of bypassed.
    evaluate: async (pageFunction: unknown, arg?: unknown): Promise<unknown> => {
      if (typeof pageFunction === 'function') {
        return (pageFunction as (value: unknown) => unknown)(arg);
      }
      if (arg !== undefined) {
        return undefined;
      }
      const source = String(pageFunction);
      if (source.includes(DOM_READ_MARKER)) {
        return Promise.resolve(state.domReadRaw);
      }
      if (source.includes(KEY_READ_MARKER)) {
        return Promise.resolve(state.keyReadRaw);
      }
      if (source.includes(KEY_PRESS_MARKER)) {
        return Promise.resolve(state.focusedRaw);
      }
      if (source.includes(REF_STATE_MARKER)) {
        return Promise.resolve(state.refState);
      }
      if (source.includes(BOX_MARKER)) {
        return Promise.resolve(state.boxRaw);
      }
      if (source.includes(STAMP_MARKER)) {
        state.stampCalls.push('stamp');
        return Promise.resolve(true);
      }
      if (source.includes(UNSTAMP_MARKER)) {
        state.stampCalls.push('unstamp');
        return Promise.resolve(true);
      }
      if (source.includes(DESCRIBE_MATCHES_MARKER)) {
        return Promise.resolve(state.describeMatchesRaw);
      }
      if (source.includes(NEAREST_NAMES_MARKER)) {
        return Promise.resolve(state.nearestNamesRaw);
      }
      if (source.includes(ROOT_CHECK_MARKER)) {
        return Promise.resolve(state.rootPresent);
      }
      return Promise.resolve(state.evaluateSourceResult);
    },
    waitForFunction: async (source: unknown, _arg: unknown, options: unknown): Promise<unknown> => {
      state.waitForFunctionCalls.push({ source, options });
      if (state.waitForFunctionRejects) {
        return Promise.reject(new Error('Timeout 30000ms exceeded'));
      }
      return Promise.resolve(true);
    },
    addInitScript: async (script: unknown) => {
      state.initScripts.push(script);
      return Promise.resolve(undefined);
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
    setKeyReadResult: ({ raw }): void => {
      state.keyReadRaw = raw;
    },
    setDomReadResult: ({ raw }): void => {
      state.domReadRaw = raw;
    },
    setRefState: ({ state: refState }): void => {
      state.refState = refState;
    },
    setBoxResult: ({ raw }): void => {
      state.boxRaw = raw;
    },
    setEvaluateSourceResult: ({ result }): void => {
      state.evaluateSourceResult = result;
    },
    setFocusedResult: ({ raw }): void => {
      state.focusedRaw = raw;
    },
    setRootPresent: ({ present }: { present: boolean }): void => {
      state.rootPresent = present;
    },
    getInitScripts: (): readonly unknown[] => state.initScripts,
    getStampCalls: (): readonly unknown[] => state.stampCalls,
    getScreenshotCalls: (): readonly unknown[] => state.screenshotCalls,
    getClickCalls: (): readonly unknown[] => state.clickCalls,
    getFillCalls: (): readonly unknown[] => state.fillCalls,
    getKeyboardPressCalls: (): readonly unknown[] => state.keyboardPressCalls,
    getWaitForCalls: (): readonly unknown[] => state.waitForCalls,
    getWaitForFunctionCalls: (): readonly unknown[] => state.waitForFunctionCalls,
    setWaitForFunctionRejects: (): void => {
      state.waitForFunctionRejects = true;
    },
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
