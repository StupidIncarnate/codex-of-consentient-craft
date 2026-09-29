// PURPOSE: Proxy for browserSessionLaunchBroker. Composes `chromiumProxy` for the whole Playwright
// boundary — the launch is staged here, once, because every session launches exactly one browser —
// and exposes one semantic staging method per page read the facade makes, each addressed by the
// source string (or page function) that read sends to `page.evaluate`. The adapter-side halves stay
// here too: the `Date.now` spy and the `homedir`/`join` passthroughs.
// USAGE: const proxy = browserSessionLaunchBrokerProxy(); proxy.setLocatorCount({ selector, count: 2 });
//        const session = await browserSessionLaunchBroker({ baseUrl, evidencePath });

import { homedir } from '#gateway/node/os';
import { join } from '#gateway/node/path';
import { chromiumProxy } from '#gateway/npm/playwright__test/chromium/chromium.proxy';
import { registerMock, registerSpyOn, requireActual } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

import { ReadingCountStub } from '../../../contracts/reading-count/reading-count.stub';
import { keyPressTransformer } from '../../../transformers/key-press/key-press-transformer';
import { rootCheckTransformer } from '../../../transformers/root-check/root-check-transformer';
import { pastePayloadLayerBrokerProxy } from './paste-payload-layer-broker.proxy';
import { refRegistryLayerBroker } from './ref-registry-layer-broker';
import { refRegistryLayerBrokerProxy } from './ref-registry-layer-broker.proxy';
import { settleWaitLayerBrokerProxy } from './settle-wait-layer-broker.proxy';

type ReadingCount = ReturnType<typeof ReadingCountStub>;

const FIXED_EPOCH_MS = 1_700_000_000_000;

export const browserSessionLaunchBrokerProxy = (): {
  setLocatorCount: (params: { selector: string; count: number }) => void;
  setDescribeMatchesResult: (params: { raw: readonly unknown[] }) => void;
  setNearestNamesResult: (params: { raw: readonly unknown[] }) => void;
  setKeyReadResult: (params: { raw: unknown }) => void;
  setDomReadResult: (params: { raw: unknown }) => void;
  setRefState: (params: { ref: number; state: string }) => void;
  setBoxResult: (params: { ref: number; raw: unknown }) => void;
  setEvaluateSourceResult: (params: { source: string; result: unknown }) => void;
  setFocusedResult: (params: { raw: unknown }) => void;
  setRootPresent: (params: { present: boolean }) => void;
  setSettleProbeResult: (params: { raw: unknown }) => void;
  setStorageResult: (params: { raw: unknown }) => void;
  setupFileExists: (params: { filePath: string; content: Buffer }) => void;
  setWaitForFunctionRejects: (params: { source: string; error: Error }) => void;
  setLocatorActionRejects: (params: {
    action: 'click' | 'fill' | 'focus' | 'waitFor';
    selector: string;
    error: Error;
  }) => void;
  setVideoPath: (params: { videoPath: string }) => void;
  setNoVideo: () => void;
  getLaunchCalls: () => RecordedCalls;
  getNewContextCalls: () => RecordedCalls;
  getGrantPermissionsCalls: () => RecordedCalls;
  getBrowserCloseCalls: () => RecordedCalls;
  getGotoCalls: () => RecordedCalls;
  getInitScripts: () => RecordedCalls;
  getStampCalls: () => readonly unknown[];
  getScreenshotCalls: () => RecordedCalls;
  getSetViewportSizeCalls: () => RecordedCalls;
  getClickCalls: () => RecordedCalls;
  getFocusCalls: () => RecordedCalls;
  getFillCalls: () => RecordedCalls;
  getWaitForCalls: () => RecordedCalls;
  getKeyboardPressCalls: () => RecordedCalls;
  getWaitForFunctionCalls: () => RecordedCalls;
  getWaitForTimeoutCalls: () => RecordedCalls;
  getStorageReadPrefixes: () => readonly unknown[];
  getClearStorageCallCount: () => ReadingCount;
  getClipboardWrites: () => readonly unknown[];
  emitConsoleMessage: (params: { type: string; text: string; url: string; line: number }) => void;
  emitPageError: (params: { name: string; message: string; stack?: string }) => void;
  emitResponse: (params: {
    method: string;
    url: string;
    resourceType: string;
    status: number;
    requestBody: string | null;
    body: string | Error;
  }) => Promise<void>;
  emitRequestFailed: (params: {
    method: string;
    url: string;
    resourceType: string;
    requestBody: string | null;
    errorText: string;
  }) => void;
  emitRequestStarted: (params: { method: string; url: string; resourceType: string }) => void;
  emitWebsocket: (params: { url: string }) => {
    frameSent: (params: { payload: string | Buffer }) => void;
    frameReceived: (params: { payload: string | Buffer }) => void;
    close: () => void;
  };
} => {
  // `homedir`/`join` are bare re-exports with no wrapper proxy of their own, so the real
  // implementations run through a passthrough: the PLAYWRIGHT_BROWSERS_PATH default reads the REAL
  // OS home, and every `join(evidencePath, 'video')` needs a genuine path.
  const realOs = requireActual<{ homedir: typeof homedir }>({ module: 'os' });
  registerMock({ fn: homedir })
    .calledWith([])
    .implement(() => realOs.homedir());
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  registerMock({ fn: join })
    .calledWith([])
    .implement((...segments: never[]) => realPath.join(...segments));

  refRegistryLayerBrokerProxy();
  // Built before the `Date.now` spy below: its virtual clock is a `Date.now` staging at the same
  // address, and the later one wins, so every facade reading is stamped FIXED_EPOCH_MS.
  settleWaitLayerBrokerProxy();
  const pasteProxy = pastePayloadLayerBrokerProxy();
  const playwrightProxy = chromiumProxy();
  playwrightProxy.launchResolves({ options: { headless: true } });

  registerSpyOn({ object: Date, method: 'now' }).calledWith([]).returns(FIXED_EPOCH_MS);

  const refRegistry = refRegistryLayerBroker();
  // One distinct marker per source builder: `params.target` is only in describeMatches' source,
  // the testid listing only in nearestNames', `hasContentDescendant` only in the key reader's,
  // `childElementCount` only in the DOM reader's, `__siegeSettle` only in the settle probe.
  const isSourceWith =
    ({ marker }: { marker: string }) =>
    (value: unknown): boolean =>
      typeof value === 'string' && value.includes(marker);
  const isPageFunctionWith =
    ({ marker }: { marker: string }) =>
    (value: unknown): boolean =>
      typeof value === 'function' && String(value).includes(marker);
  // Stamp and unstamp both remove the attribute; only a stamp SETS it.
  const isStamp = isSourceWith({ marker: "setAttribute('siege-target'" });
  const isStampOrUnstamp = (value: unknown): boolean =>
    isStamp(value) || value === refRegistry.unstampSource();
  const isStorageRead = isPageFunctionWith({ marker: 'window.localStorage.getItem' });
  const isStorageClear = isPageFunctionWith({ marker: 'window.localStorage.clear()' });
  const isClipboardWrite = isPageFunctionWith({ marker: 'navigator.clipboard.writeText' });

  // The void page writes answer nothing a caller reads, so they are record-and-resolve here, the
  // same way `chromiumProxy` treats every void page action; each is read back below.
  playwrightProxy.evaluateReturns({ source: isStamp, result: true });
  playwrightProxy.evaluateReturns({ source: refRegistry.unstampSource(), result: true });
  playwrightProxy.evaluateReturns({ source: isStorageClear, result: undefined });
  playwrightProxy.evaluateReturns({ source: isClipboardWrite, result: undefined });

  return {
    setLocatorCount: ({ selector, count }): void => {
      playwrightProxy.locatorCountReturns({ selector, count });
    },
    setDescribeMatchesResult: ({ raw }): void => {
      playwrightProxy.evaluateReturns({
        source: isSourceWith({ marker: 'params.target' }),
        result: raw,
      });
    },
    setNearestNamesResult: ({ raw }): void => {
      playwrightProxy.evaluateReturns({
        source: isSourceWith({ marker: "querySelectorAll('[data-testid]')).map" }),
        result: raw,
      });
    },
    setKeyReadResult: ({ raw }): void => {
      playwrightProxy.evaluateReturns({
        source: isSourceWith({ marker: 'hasContentDescendant' }),
        result: raw,
      });
    },
    setDomReadResult: ({ raw }): void => {
      playwrightProxy.evaluateReturns({
        source: isSourceWith({ marker: 'childElementCount' }),
        result: raw,
      });
    },
    setRefState: ({ ref, state }): void => {
      playwrightProxy.evaluateReturns({
        source: refRegistry.refStateSource({ ref }),
        result: state,
      });
    },
    setBoxResult: ({ ref, raw }): void => {
      playwrightProxy.evaluateReturns({ source: refRegistry.boxSource({ ref }), result: raw });
    },
    setEvaluateSourceResult: ({ source, result }): void => {
      playwrightProxy.evaluateReturns({ source, result });
    },
    setFocusedResult: ({ raw }): void => {
      playwrightProxy.evaluateReturns({
        source: keyPressTransformer().focusReadSource(),
        result: raw,
      });
    },
    setRootPresent: ({ present }): void => {
      playwrightProxy.evaluateReturns({
        source: rootCheckTransformer().checkSource(),
        result: present,
      });
    },
    setSettleProbeResult: ({ raw }): void => {
      playwrightProxy.evaluateReturns({
        source: isSourceWith({ marker: '__siegeSettle' }),
        result: raw,
      });
    },
    setStorageResult: ({ raw }): void => {
      playwrightProxy.evaluateReturns({ source: isStorageRead, result: raw });
    },
    setupFileExists: ({ filePath, content }): void => {
      pasteProxy.setupFileExists({ filePath, content });
    },
    setWaitForFunctionRejects: ({ source, error }): void => {
      playwrightProxy.waitForFunctionRejects({ source, error });
    },
    setLocatorActionRejects: ({ action, selector, error }): void => {
      playwrightProxy.locatorActionRejects({ action, selector, error });
    },
    setVideoPath: ({ videoPath }): void => {
      playwrightProxy.videoRecorded({ path: videoPath });
    },
    setNoVideo: (): void => {
      playwrightProxy.videoAbsent();
    },

    getLaunchCalls: (): RecordedCalls => playwrightProxy.getLaunchCalls(),
    getNewContextCalls: (): RecordedCalls => playwrightProxy.getNewContextCalls(),
    getGrantPermissionsCalls: (): RecordedCalls => playwrightProxy.getGrantPermissionsCalls(),
    getBrowserCloseCalls: (): RecordedCalls => playwrightProxy.getBrowserCloseCalls(),
    getGotoCalls: (): RecordedCalls => playwrightProxy.getGotoCalls(),
    getInitScripts: (): RecordedCalls => playwrightProxy.getAddInitScriptCalls(),
    getStampCalls: (): readonly unknown[] =>
      playwrightProxy
        .getEvaluateCallsFor({ source: isStampOrUnstamp })
        .map(([source]) => (isStamp(source) ? 'stamp' : 'unstamp')),
    getScreenshotCalls: (): RecordedCalls => playwrightProxy.getScreenshotCalls(),
    getSetViewportSizeCalls: (): RecordedCalls => playwrightProxy.getSetViewportSizeCalls(),
    getClickCalls: (): RecordedCalls => playwrightProxy.getLocatorCalls({ action: 'click' }),
    getFocusCalls: (): RecordedCalls => playwrightProxy.getLocatorCalls({ action: 'focus' }),
    getFillCalls: (): RecordedCalls => playwrightProxy.getLocatorCalls({ action: 'fill' }),
    getWaitForCalls: (): RecordedCalls => playwrightProxy.getLocatorCalls({ action: 'waitFor' }),
    getKeyboardPressCalls: (): RecordedCalls => playwrightProxy.getKeyboardPressCalls(),
    getWaitForFunctionCalls: (): RecordedCalls => playwrightProxy.getWaitForFunctionCalls(),
    getWaitForTimeoutCalls: (): RecordedCalls => playwrightProxy.getWaitForTimeoutCalls(),
    getStorageReadPrefixes: (): readonly unknown[] =>
      playwrightProxy.getEvaluateCallsFor({ source: isStorageRead }).map((call) => call[1]),
    getClearStorageCallCount: (): ReadingCount =>
      ReadingCountStub({
        value: playwrightProxy.getEvaluateCallsFor({ source: isStorageClear }).length,
      }),
    getClipboardWrites: (): readonly unknown[] =>
      playwrightProxy.getEvaluateCallsFor({ source: isClipboardWrite }).map((call) => call[1]),

    emitConsoleMessage: ({ type, text, url, line }): void => {
      playwrightProxy.emitConsole({ type, text, url, lineNumber: line });
    },
    emitPageError: ({ name, message, stack }): void => {
      playwrightProxy.emitPageError({ name, message, ...(stack === undefined ? {} : { stack }) });
    },
    emitResponse: async ({ method, url, resourceType, status, requestBody, body }): Promise<void> =>
      playwrightProxy.emitResponse({
        method,
        url,
        resourceType,
        status,
        postData: requestBody,
        body,
      }),
    emitRequestFailed: ({ method, url, resourceType, requestBody, errorText }): void => {
      playwrightProxy.emitRequestFailed({
        method,
        url,
        resourceType,
        postData: requestBody,
        errorText,
      });
    },
    emitRequestStarted: ({ method, url, resourceType }): void => {
      playwrightProxy.emitRequest({ method, url, resourceType });
    },
    emitWebsocket: ({ url }) => playwrightProxy.emitWebsocket({ url }),
  };
};
