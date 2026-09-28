import { EventEmitter } from 'node:events';
import { registerModuleMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';
import { chromium } from './chromium';

// Loading `@playwright/test` for real trips the unit-test I/O trap, so it is replaced outright. The
// wrapper only reaches the package inside `launch`, and the spy below answers every launch first.
registerModuleMock({ module: '@playwright/test', factory: () => ({}) });

type Matcher = string | RegExp | ((value: unknown) => boolean);
type LaunchOptions = NonNullable<Parameters<typeof chromium.launch>[0]>;
type LocatorAction = 'click' | 'fill' | 'focus' | 'waitFor';

// The body every fake method starts with. Each one is replaced by a registerSpyOn dispatcher before
// any caller can reach it, so this never runs.
const spyTarget = (..._args: readonly unknown[]): unknown => undefined;

const isStringSource = (value: unknown): boolean => typeof value === 'string';
const isDefinedArg = (value: unknown): boolean => value !== undefined;

export const chromiumProxy = (): {
  launchResolves: (params: { options: LaunchOptions }) => void;
  getLaunchCalls: () => RecordedCalls;
  getNewContextCalls: () => RecordedCalls;
  getGrantPermissionsCalls: () => RecordedCalls;
  getBrowserCloseCalls: () => RecordedCalls;
  evaluateReturns: (params: { source: Matcher; result: unknown }) => void;
  evaluateRejects: (params: { source: Matcher; error: Error }) => void;
  getEvaluateCallsFor: (params: { source: Matcher }) => readonly unknown[][];
  locatorCountReturns: (params: { selector: Matcher; count: number }) => void;
  locatorActionRejects: (params: {
    action: LocatorAction;
    selector: Matcher;
    error: Error;
  }) => void;
  getLocatorCalls: (params: { action: LocatorAction }) => RecordedCalls;
  getKeyboardPressCalls: () => RecordedCalls;
  waitForFunctionRejects: (params: { source: Matcher; error: Error }) => void;
  getWaitForFunctionCalls: () => RecordedCalls;
  getWaitForTimeoutCalls: () => RecordedCalls;
  getAddInitScriptCalls: () => RecordedCalls;
  getSetViewportSizeCalls: () => RecordedCalls;
  getScreenshotCalls: () => RecordedCalls;
  getGotoCalls: () => RecordedCalls;
  videoRecorded: (params: { path: string }) => void;
  videoAbsent: () => void;
  emitConsole: (params: { type: string; text: string; url: string; lineNumber: number }) => void;
  emitPageError: (params: { name: string; message: string; stack?: string }) => void;
  emitRequest: (params: { method: string; url: string; resourceType: string }) => void;
  emitResponse: (params: {
    method: string;
    url: string;
    resourceType: string;
    postData: string | null;
    status: number;
    body: string | Error;
  }) => Promise<void>;
  emitRequestFailed: (params: {
    method: string;
    url: string;
    resourceType: string;
    postData: string | null;
    errorText: string;
  }) => void;
  emitWebsocket: (params: { url: string }) => {
    frameSent: (params: { payload: string | Buffer }) => void;
    frameReceived: (params: { payload: string | Buffer }) => void;
    close: () => void;
  };
} => {
  // A locator is built per `page.locator(selector)` call; its actions all land on these shared
  // spies with the selector as argument 0, so staging and read-back address a selector directly.
  const locatorActions = {
    count: spyTarget,
    click: spyTarget,
    fill: spyTarget,
    focus: spyTarget,
    waitFor: spyTarget,
  };
  const keyboard = { press: spyTarget };
  const page = Object.assign(new EventEmitter(), {
    evaluate: spyTarget,
    waitForFunction: spyTarget,
    waitForTimeout: spyTarget,
    addInitScript: spyTarget,
    setViewportSize: spyTarget,
    screenshot: spyTarget,
    goto: spyTarget,
    video: spyTarget,
    keyboard,
    locator: (selector: string) => ({
      count: (...args: readonly unknown[]): unknown => locatorActions.count(selector, ...args),
      click: (...args: readonly unknown[]): unknown => locatorActions.click(selector, ...args),
      fill: (...args: readonly unknown[]): unknown => locatorActions.fill(selector, ...args),
      focus: (...args: readonly unknown[]): unknown => locatorActions.focus(selector, ...args),
      waitFor: (...args: readonly unknown[]): unknown => locatorActions.waitFor(selector, ...args),
    }),
  });
  const context = { newPage: spyTarget, grantPermissions: spyTarget, close: spyTarget };
  const browser = { newContext: spyTarget, close: spyTarget };

  const launchHandle = registerSpyOn({ object: chromium, method: 'launch' });

  // The structural chain answers every call: each fake exists only because a test staged the
  // launch that returns it, and there is one browser, one context and one page per proxy.
  const newContextHandle = registerSpyOn({ object: browser, method: 'newContext' });
  newContextHandle.calledWith([]).resolves(context);
  const browserCloseHandle = registerSpyOn({ object: browser, method: 'close' });
  browserCloseHandle.calledWith([]).resolves(undefined);
  registerSpyOn({ object: context, method: 'newPage' }).calledWith([]).resolves(page);
  const grantPermissionsHandle = registerSpyOn({ object: context, method: 'grantPermissions' });
  grantPermissionsHandle.calledWith([]).resolves(undefined);
  registerSpyOn({ object: context, method: 'close' }).calledWith([]).resolves(undefined);

  // Reads are addressed and throw unstaged. Real Playwright applies evaluate's second argument only
  // to a FUNCTION page function; a string source is evaluated bare and its arg dropped, so a
  // function-valued expression serializes to undefined. This two-argument address outranks every
  // one-argument staging, so a string source handed an arg reads undefined as it would for real.
  const evaluateHandle = registerSpyOn({ object: page, method: 'evaluate' });
  evaluateHandle.calledWith([isStringSource, isDefinedArg]).resolves(undefined);
  const countHandle = registerSpyOn({ object: locatorActions, method: 'count' });
  const videoHandle = registerSpyOn({ object: page, method: 'video' });

  // Void actions record and resolve; a test overrides one by address with a rejection.
  const actionHandles = {
    click: registerSpyOn({ object: locatorActions, method: 'click' }),
    fill: registerSpyOn({ object: locatorActions, method: 'fill' }),
    focus: registerSpyOn({ object: locatorActions, method: 'focus' }),
    waitFor: registerSpyOn({ object: locatorActions, method: 'waitFor' }),
  };
  const pressHandle = registerSpyOn({ object: keyboard, method: 'press' });
  const waitForFunctionHandle = registerSpyOn({ object: page, method: 'waitForFunction' });
  const waitForTimeoutHandle = registerSpyOn({ object: page, method: 'waitForTimeout' });
  const addInitScriptHandle = registerSpyOn({ object: page, method: 'addInitScript' });
  const setViewportSizeHandle = registerSpyOn({ object: page, method: 'setViewportSize' });
  const screenshotHandle = registerSpyOn({ object: page, method: 'screenshot' });
  const gotoHandle = registerSpyOn({ object: page, method: 'goto' });
  actionHandles.click.calledWith([]).resolves(undefined);
  actionHandles.fill.calledWith([]).resolves(undefined);
  actionHandles.focus.calledWith([]).resolves(undefined);
  actionHandles.waitFor.calledWith([]).resolves(undefined);
  pressHandle.calledWith([]).resolves(undefined);
  waitForFunctionHandle.calledWith([]).resolves(undefined);
  waitForTimeoutHandle.calledWith([]).resolves(undefined);
  addInitScriptHandle.calledWith([]).resolves(undefined);
  setViewportSizeHandle.calledWith([]).resolves(undefined);
  gotoHandle.calledWith([]).resolves(undefined);
  screenshotHandle.calledWith([]).resolves(Buffer.alloc(0));

  return {
    launchResolves: ({ options }): void => {
      launchHandle.calledWith([options]).resolves(browser);
    },
    getLaunchCalls: (): RecordedCalls => launchHandle.callsMatching([]),
    getNewContextCalls: (): RecordedCalls => newContextHandle.callsMatching([]),
    getGrantPermissionsCalls: (): RecordedCalls => grantPermissionsHandle.callsMatching([]),
    getBrowserCloseCalls: (): RecordedCalls => browserCloseHandle.callsMatching([]),

    evaluateReturns: ({ source, result }): void => {
      evaluateHandle.calledWith([source]).resolves(result);
    },
    evaluateRejects: ({ source, error }): void => {
      evaluateHandle.calledWith([source]).rejects(error);
    },
    getEvaluateCallsFor: ({ source }): readonly unknown[][] =>
      evaluateHandle.callsMatching([source]),

    locatorCountReturns: ({ selector, count }): void => {
      countHandle.calledWith([selector]).resolves(count);
    },
    locatorActionRejects: ({ action, selector, error }): void => {
      actionHandles[action].calledWith([selector]).rejects(error);
    },
    getLocatorCalls: ({ action }): RecordedCalls => actionHandles[action].callsMatching([]),

    getKeyboardPressCalls: (): RecordedCalls => pressHandle.callsMatching([]),
    waitForFunctionRejects: ({ source, error }): void => {
      waitForFunctionHandle.calledWith([source]).rejects(error);
    },
    getWaitForFunctionCalls: (): RecordedCalls => waitForFunctionHandle.callsMatching([]),
    getWaitForTimeoutCalls: (): RecordedCalls => waitForTimeoutHandle.callsMatching([]),
    getAddInitScriptCalls: (): RecordedCalls => addInitScriptHandle.callsMatching([]),
    getSetViewportSizeCalls: (): RecordedCalls => setViewportSizeHandle.callsMatching([]),
    getScreenshotCalls: (): RecordedCalls => screenshotHandle.callsMatching([]),
    getGotoCalls: (): RecordedCalls => gotoHandle.callsMatching([]),

    videoRecorded: ({ path }): void => {
      videoHandle.calledWith([]).returns({ path: async () => Promise.resolve(path) });
    },
    videoAbsent: (): void => {
      videoHandle.calledWith([]).returns(null);
    },

    emitConsole: ({ type, text, url, lineNumber }): void => {
      page.emit('console', {
        type: () => type,
        text: () => text,
        location: () => ({ url, lineNumber, columnNumber: 0 }),
      });
    },
    emitPageError: ({ name, message, stack }): void => {
      const error = new Error(message);
      error.name = name;
      // An error thrown in the page may carry no stack at all; an omitted one reads undefined.
      if (stack === undefined) {
        Reflect.deleteProperty(error, 'stack');
      } else {
        error.stack = stack;
      }
      page.emit('pageerror', error);
    },
    emitRequest: ({ method, url, resourceType }): void => {
      page.emit('request', {
        method: () => method,
        url: () => url,
        resourceType: () => resourceType,
      });
    },
    emitResponse: async ({ method, url, resourceType, postData, status, body }): Promise<void> => {
      const request = {
        method: () => method,
        url: () => url,
        resourceType: () => resourceType,
        postData: () => postData,
      };
      page.emit('response', {
        request: () => request,
        status: () => status,
        text: async () => (body instanceof Error ? Promise.reject(body) : Promise.resolve(body)),
      });
      // A response listener reads its body through a promise chain it does not await; one
      // macrotask lets every microtask in that chain settle before the test reads what it built.
      await new Promise((resolve) => {
        setImmediate(resolve);
      });
    },
    emitRequestFailed: ({ method, url, resourceType, postData, errorText }): void => {
      page.emit('requestfailed', {
        method: () => method,
        url: () => url,
        resourceType: () => resourceType,
        postData: () => postData,
        failure: () => ({ errorText }),
      });
    },
    emitWebsocket: ({ url }) => {
      const socket = Object.assign(new EventEmitter(), { url: () => url });
      page.emit('websocket', socket);
      return {
        frameSent: ({ payload }): void => {
          socket.emit('framesent', { payload });
        },
        frameReceived: ({ payload }): void => {
          socket.emit('framereceived', { payload });
        },
        close: (): void => {
          socket.emit('close', socket);
        },
      };
    },
  };
};
