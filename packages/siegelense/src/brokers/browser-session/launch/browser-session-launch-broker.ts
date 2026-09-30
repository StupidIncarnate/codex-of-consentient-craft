/**
 * PURPOSE: Launches one throwaway Chromium instance against `baseUrl` and closes over it as the
 * `BrowserSession` facade every step-running broker drives — the ONLY file in this package that
 * launches a browser (through `chromium` from `#gateway/npm/playwright__test`), so every
 * `Page`/`Browser`/`Locator` it touches stays inside this one folder; its layers are handed plain
 * closures and values, never the page. `packages/web/test/siege-driver/siege-lane.ts` lines 204-341 is the measured
 * shape for the launch and every listener; `listenerLinesTransformer` builds the JSON line for each one
 * from plain values this file extracts, so the npm boundary stays in exactly one place. Targeting
 * methods (`countMatches`, `clickMatch`, `fillMatch`, `waitForMatch`) never call `.first()`/`.last()`
 * — `within` and `target` compose into ONE CSS descendant selector Playwright resolves in strict
 * mode, which is what leaves the ambiguity decision to the caller instead of silently picking a
 * match. **Driving by REF goes through that same strict locator**, by stamping the element and
 * resolving the stamp, so a ref inherits the no-pick guarantee rather than sitting beside it.
 *
 * `mintState.highest` is the only piece of ref state Node keeps, and it exists because the page
 * cannot answer one question about itself: after a navigation the registry comes back EMPTY, so a
 * ref this instance minted and a ref carried in from a DIFFERENT instance both read as "past the
 * end" — two failures whose recovery is different. The counter survives navigation and dies with the
 * instance, which is exactly the lifetime a ref has. It is a HOLDER whose field mutates rather than
 * a reassigned `let`, matching `run-execute-broker.ts`'s `cursorState`, so a read before an await
 * and a write after it never give `require-atomic-updates` cause to flag it.
 *
 * USAGE:
 * const session = await browserSessionLaunchBroker({ baseUrl: 'http://localhost:5173', evidencePath });
 * const key = await session.look({ within: null });
 * await session.clickRef({ ref: 23, timeoutMs: 30000 });
 * await session.close();
 */

import { chromium } from '#gateway/npm/playwright__test';
import { homedir } from '#gateway/node/os';
import { join } from '#gateway/node/path';
import { getEnv, setEnv, stderr } from '#gateway/node/process';
import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { boxReadingContract } from '../../../contracts/box-reading/box-reading-contract';
import type { BoxReading } from '../../../contracts/box-reading/box-reading-contract';
import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import type { KeyListing } from '../../../contracts/key-listing/key-listing-contract';
import { matchCountContract } from '../../../contracts/match-count/match-count-contract';
import { locatorStateContract } from '../../../contracts/locator-state/locator-state-contract';
import type { RefResolution } from '../../../contracts/ref-resolution/ref-resolution-contract';
import { selectorContract } from '../../../contracts/selector/selector-contract';
import { driverStatics } from '../../../statics/driver/driver-statics';
import { stepCandidateContract } from '../../../contracts/step-candidate/step-candidate-contract';
import type { StepCandidate } from '../../../contracts/step-candidate/step-candidate-contract';
import type { DomField } from '../../../contracts/dom-field/dom-field-contract';
import type { DomReading } from '../../../contracts/dom-reading/dom-reading-contract';
import type { DomTextMode } from '../../../contracts/dom-text-mode/dom-text-mode-contract';
import { bufferLengthsContract } from '../../../contracts/buffer-lengths/buffer-lengths-contract';
import type { BufferLengths } from '../../../contracts/buffer-lengths/buffer-lengths-contract';
import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import type { MatchCount } from '../../../contracts/match-count/match-count-contract';
import type { KeyReading } from '../../../contracts/key-reading/key-reading-contract';
import type { SettleReading } from '../../../contracts/settle-reading/settle-reading-contract';
import { storageReadingContract } from '../../../contracts/storage-reading/storage-reading-contract';
import type { StorageReading } from '../../../contracts/storage-reading/storage-reading-contract';
import { videoResultContract } from '../../../contracts/video-result/video-result-contract';
import type { VideoResult } from '../../../contracts/video-result/video-result-contract';
import type { VideoAction } from '../../../contracts/video-action/video-action-contract';
import { domReadTransformer } from '../../../transformers/dom-read/dom-read-transformer';
import { keyPressTransformer } from '../../../transformers/key-press/key-press-transformer';
import { keyReadTransformer } from '../../../transformers/key-read/key-read-transformer';
import { listenerLinesTransformer } from '../../../transformers/listener-lines/listener-lines-transformer';
import { rootCheckTransformer } from '../../../transformers/root-check/root-check-transformer';
import { pastePayloadLayerBroker } from './paste-payload-layer-broker';
import { refRegistryLayerBroker } from './ref-registry-layer-broker';
import { settleWaitLayerBroker } from './settle-wait-layer-broker';

// A zero-match error names the near-miss testIds on the page; this bounds that listing so a
// testid-dense screen does not post hundreds of names into one error message.
const NEAREST_NAMES_LIMIT = 50;

// Walks up from each match for the nearest `data-testid` ancestor (own text nodes only, never
// `textContent` — a recursive read once pulled a whole stylesheet into one reading) and formats its
// rect as `(x,y) WxH`, matching `stepCandidateContract`'s own example. `querySelectorAll` only, on
// both the `within` scope and the `target` — a bare `querySelector` silently returns match one,
// which is `.first()` again wearing a different name.
//
// Each candidate also MINTS A REF, through the same mint-or-reuse the key uses, and that is what
// makes the ambiguity error's advice followable: two candidates sharing a `within` cannot be told
// apart by narrowing, which is the measured dead end at `scrolls/seigelense/HANDOFF.md` lines
// 206-214, and a ref separates them because it binds to one element.
const DESCRIBE_MATCHES_SOURCE = `(params) => {
  if (window.__siege === undefined) { window.__siege = { refs: [] }; }
  const registry = window.__siege.refs;
  const roots = params.within === null
    ? [document]
    : Array.from(document.querySelectorAll(params.within));
  const matches = [];
  roots.forEach((root) => {
    Array.from(root.querySelectorAll(params.target)).forEach((element) => {
      matches.push(element);
    });
  });
  return matches.map((element, index) => {
    const rect = element.getBoundingClientRect();
    let ancestor = element.parentElement;
    let nearest = null;
    while (ancestor !== null) {
      const testId = ancestor.getAttribute('data-testid');
      if (testId !== null) {
        nearest = '[data-testid="' + testId + '"]';
        break;
      }
      ancestor = ancestor.parentElement;
    }
    let text = '';
    element.childNodes.forEach((node) => {
      if (node.nodeType === 3) {
        text += node.nodeValue || '';
      }
    });
    let registryIndex = registry.indexOf(element);
    if (registryIndex === -1) { registry.push(element); registryIndex = registry.length - 1; }
    return {
      index,
      ref: registryIndex + 1,
      within: nearest,
      text,
      rect: '(' + Math.round(rect.x) + ',' + Math.round(rect.y) + ') ' + Math.round(rect.width) + 'x' + Math.round(rect.height),
    };
  });
}`;

const NEAREST_NAMES_SOURCE = `() => Array.from(document.querySelectorAll('[data-testid]')).map((element) => element.getAttribute('data-testid')).filter((value) => value !== null)`;

export const browserSessionLaunchBroker = async ({
  baseUrl,
  // Used for recordVideo.dir so screencast recordings land in the run's evidence directory.
  evidencePath,
}: {
  baseUrl: string;
  evidencePath: string;
}): Promise<BrowserSession> => {
  if (getEnv('PLAYWRIGHT_BROWSERS_PATH') === undefined) {
    setEnv('PLAYWRIGHT_BROWSERS_PATH', join(homedir(), '.cache', 'ms-playwright'));
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    baseURL: baseUrl,
    recordVideo: { dir: join(evidencePath, 'video') },
  });
  // A real Ctrl+V is the only paste that arrives with isTrusted true, and it needs the clipboard
  // to be readable from the page's own origin.
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: baseUrl });
  const page = await context.newPage();

  const consoleLines: string[] = [];
  const networkLines: string[] = [];
  const websocketLines: string[] = [];
  const linesBuild = listenerLinesTransformer();
  const refRegistry = refRegistryLayerBroker();
  const keyReader = keyReadTransformer();
  const domReader = domReadTransformer();
  const keyPress = keyPressTransformer();
  const rootChecker = rootCheckTransformer();
  // `pollerRepeatThreshold` at CONSTRUCTION, from `driverStatics.settle` — not the layer's own
  // built-in default, which happens to carry the same number today but would silently drift from
  // this static the moment either one changed without the other.
  const settleWait = settleWaitLayerBroker({
    evaluate: async ({ source }) => page.evaluate(source),
    pause: async ({ ms }) => page.waitForTimeout(ms),
    pollerRepeatThreshold: driverStatics.settle.pollerRepeatThreshold,
  });
  // See the header: a HOLDER, not a reassigned `let`, and the one piece of ref state Node keeps.
  const mintState = { highest: 0 };
  const videoState = { isRecording: false };

  // Installed before the page's own script on EVERY document, so a navigation empties the registry
  // by construction rather than by anyone remembering to clear it.
  await page.addInitScript(refRegistry.initScriptSource());
  // The settle detector's MutationObserver, armed on the same terms and for the same reason: an
  // observer installed when a WAIT starts has already missed the render that wait was asked about.
  await page.addInitScript(settleWait.initScriptSource());

  // Every listener below is armed HERE, once, before the page has navigated anywhere. A listener
  // attached when a read is asked for has already missed every message that read was asked about.
  page.on('console', (message) => {
    const location = message.location();
    consoleLines.push(
      linesBuild.consoleLine({
        at: epochMsContract.parse(Date.now()),
        type: message.type(),
        text: message.text(),
        url: location.url,
        line: location.lineNumber,
      }),
    );
  });

  page.on('pageerror', (error) => {
    consoleLines.push(
      linesBuild.pageErrorLine({
        at: epochMsContract.parse(Date.now()),
        type: error.name,
        text: error.message,
        stack: error.stack ?? null,
      }),
    );
  });

  // The ONE listener the existing plumbing cannot supply: `response` and `requestfailed` both
  // report a request ENDING, so without a start edge a three-second fetch still in flight is
  // indistinguishable from an idle page and the settle detector would call it quiet.
  page.on('request', (request) => {
    settleWait.noteRequestStarted({
      method: request.method(),
      url: request.url(),
      resourceType: request.resourceType(),
    });
  });

  page.on('response', (response) => {
    const request = response.request();
    const resourceType = request.resourceType();
    settleWait.noteRequestSettled({ method: request.method(), url: request.url() });
    const bodyPromise = linesBuild.isBodySkippedResourceType({ resourceType })
      ? Promise.resolve(linesBuild.skippedBodyPlaceholder())
      : response.text().then(
          (body) => linesBuild.truncatedBody({ text: body }),
          (error: unknown) => linesBuild.unavailableBodyPlaceholder({ error }),
        );
    bodyPromise
      .then((responseBody) => {
        networkLines.push(
          linesBuild.networkLine({
            at: epochMsContract.parse(Date.now()),
            method: request.method(),
            url: request.url(),
            resourceType,
            status: response.status(),
            requestBody: request.postData(),
            responseBody,
          }),
        );
      })
      .catch((error: unknown) => {
        stderr.write(`[browser-session-launch-broker] response capture failed: ${String(error)}\n`);
      });
  });

  page.on('requestfailed', (request) => {
    settleWait.noteRequestSettled({ method: request.method(), url: request.url() });
    networkLines.push(
      linesBuild.requestFailedLine({
        at: epochMsContract.parse(Date.now()),
        method: request.method(),
        url: request.url(),
        resourceType: request.resourceType(),
        requestBody: request.postData(),
        errorText: request.failure()?.errorText ?? 'unknown',
      }),
    );
  });

  page.on('websocket', (socket) => {
    const socketUrl = socket.url();
    socket.on('framesent', (frame) => {
      const { payload } = frame;
      websocketLines.push(
        linesBuild.websocketFrameLine({
          at: epochMsContract.parse(Date.now()),
          url: socketUrl,
          direction: 'sent',
          payload:
            typeof payload === 'string'
              ? linesBuild.truncatePayload({ text: payload })
              : '<binary>',
        }),
      );
    });
    socket.on('framereceived', (frame) => {
      const { payload } = frame;
      websocketLines.push(
        linesBuild.websocketFrameLine({
          at: epochMsContract.parse(Date.now()),
          url: socketUrl,
          direction: 'received',
          payload:
            typeof payload === 'string'
              ? linesBuild.truncatePayload({ text: payload })
              : '<binary>',
        }),
      );
    });
    socket.on('close', () => {
      websocketLines.push(
        linesBuild.websocketCloseLine({ at: epochMsContract.parse(Date.now()), url: socketUrl }),
      );
    });
  });

  return {
    goto: async ({ url }: { url: string }): Promise<void> => {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: driverStatics.run.defaultStepTimeoutMs,
      });
    },

    look: async ({ within }: { within: string | null }): Promise<KeyListing> => {
      const scope = within === null ? null : selectorContract.parse(within);
      const raw: unknown = await page.evaluate(keyReader.readSource({ within: scope }));
      mintState.highest = Math.max(mintState.highest, keyReader.highestRefOf({ raw }));
      return keyReader.toListing({ raw, within: scope });
    },

    refState: async ({ ref }: { ref: number }): Promise<RefResolution> => {
      const raw: unknown = await page.evaluate(refRegistry.refStateSource({ ref }));
      return refRegistry.toResolution({ raw, ref, highestMinted: mintState.highest });
    },

    countMatches: async ({
      target,
      within,
    }: {
      target: string;
      within?: string;
    }): Promise<MatchCount> => {
      const scoped = within === undefined ? target : `${within} ${target}`;
      const count = await page.locator(scoped).count();
      return matchCountContract.parse(count);
    },

    describeMatches: async ({
      target,
      within,
    }: {
      target: string;
      within?: string;
    }): Promise<readonly StepCandidate[]> => {
      // `page.evaluate(source, arg)` only threads `arg` into a REAL function reference — Playwright's
      // client tags the call with `isFunction: typeof pageFunction === 'function'`
      // (playwright-core lib/client/jsHandle.js), and its browser-side utility script
      // (lib/generated/utilityScriptSource.js `evaluate()`) applies an argument ONLY when that flag
      // is true. `DESCRIBE_MATCHES_SOURCE` is a STRING (this package's tsconfig carries no "dom" lib,
      // so it cannot be a typed function literal), so Playwright `eval`s it as a bare expression and
      // never calls the result with `arg` at all — an un-called function then fails to serialize and
      // comes back `undefined`. Embedding the params as JSON into a self-invoking call instead makes
      // the whole expression BE the call, so Playwright hands back its already-computed result.
      const params = JSON.stringify({ target, within: within ?? null });
      const raw: unknown = await page.evaluate(`(${DESCRIBE_MATCHES_SOURCE})(${params})`);
      const candidates = stepCandidateContract.array().parse(raw);
      // Describing candidates mints refs, exactly as `look` does, so the counter has to advance
      // here too — otherwise a ref handed out by an ambiguity error would read as "never minted by
      // this instance" the moment anyone tried to drive it.
      mintState.highest = Math.max(
        mintState.highest,
        ...candidates.map((candidate) => candidate.ref ?? 0),
      );
      return candidates;
    },

    nearestNames: async ({
      // The zero-match error names every testid on the page, not a subset filtered by the target
      // that just failed to match — see the acceptance criteria's "simple querySelectorAll read".
      target: _target,
    }: {
      target: string;
    }): Promise<readonly string[]> => {
      // Self-invoked for the same reason describeMatches is, above — a bare `() => ...` source
      // string is never called by Playwright at all, so it takes no `arg` to begin with.
      const raw = await page.evaluate(`(${NEAREST_NAMES_SOURCE})()`);
      const parsed = contentTextContract.array().parse(raw);
      const unique = Array.from(new Set(parsed)).sort();
      return unique.slice(0, NEAREST_NAMES_LIMIT);
    },

    clickMatch: async ({
      target,
      within,
      timeoutMs,
    }: {
      target: string;
      within?: string;
      timeoutMs: number;
    }): Promise<void> => {
      const scoped = within === undefined ? target : `${within} ${target}`;
      await page.locator(scoped).click({ timeout: timeoutMs });
    },

    // Stamp, drive the stamp through the strict locator, unstamp — see `refRegistryLayerBroker`'s
    // own header for why a ref does not take the ElementHandle route here. The unstamp runs in a
    // `finally` so a failed click still leaves the page as it found it; its own failure is logged
    // rather than thrown, because replacing the step's real error with a cleanup error would hide
    // the defect the walk actually hit.
    clickRef: async ({ ref, timeoutMs }: { ref: number; timeoutMs: number }): Promise<void> => {
      await page.evaluate(refRegistry.stampSource({ ref }));
      try {
        await page.locator(refRegistry.targetSelector()).click({ timeout: timeoutMs });
      } finally {
        await page.evaluate(refRegistry.unstampSource()).catch((error: unknown) => {
          stderr.write(
            `[browser-session-launch-broker] unstamp after clickRef failed: ${String(error)}\n`,
          );
        });
      }
    },

    fillRef: async ({
      ref,
      value,
      timeoutMs,
    }: {
      ref: number;
      value: string;
      timeoutMs: number;
    }): Promise<void> => {
      await page.evaluate(refRegistry.stampSource({ ref }));
      try {
        await page.locator(refRegistry.targetSelector()).fill(value, { timeout: timeoutMs });
      } finally {
        await page.evaluate(refRegistry.unstampSource()).catch((error: unknown) => {
          stderr.write(
            `[browser-session-launch-broker] unstamp after fillRef failed: ${String(error)}\n`,
          );
        });
      }
    },

    boxRef: async ({ ref }: { ref: number }): Promise<BoxReading> => {
      const raw: unknown = await page.evaluate(refRegistry.boxSource({ ref }));
      return boxReadingContract.parse(raw);
    },

    pressKey: async ({ press }: { press: string }): Promise<KeyReading> => {
      await page.keyboard.press(press);
      const raw: unknown = await page.evaluate(keyPress.focusReadSource());
      return keyPress.toReading({ press, rawFocused: raw });
    },

    fillMatch: async ({
      target,
      within,
      value,
      timeoutMs,
    }: {
      target: string;
      within?: string;
      value: string;
      timeoutMs: number;
    }): Promise<void> => {
      const scoped = within === undefined ? target : `${within} ${target}`;
      await page.locator(scoped).fill(value, { timeout: timeoutMs });
    },

    waitForMatch: async ({
      target,
      within,
      state,
      timeoutMs,
    }: {
      target: string;
      within?: string;
      state: string;
      timeoutMs: number;
    }): Promise<void> => {
      const scoped = within === undefined ? target : `${within} ${target}`;
      await page
        .locator(scoped)
        .waitFor({ state: locatorStateContract.parse(state), timeout: timeoutMs });
    },

    waitForPredicate: async ({
      source,
      timeoutMs,
    }: {
      source: string;
      timeoutMs: number;
    }): Promise<void> => {
      await page.waitForFunction(source, undefined, { timeout: timeoutMs });
    },

    waitForSettle: async ({
      quietWindowMs,
      ceilingMs,
      pollMs,
    }: {
      quietWindowMs?: number | undefined;
      ceilingMs?: number | undefined;
      pollMs?: number | undefined;
    }): Promise<SettleReading> => settleWait.waitForSettle({ quietWindowMs, ceilingMs, pollMs }),

    capture: async ({ filePath }: { filePath: string }): Promise<void> => {
      await page.screenshot({ path: filePath, animations: 'disabled', caret: 'hide' });
    },

    captureLive: async ({ filePath }: { filePath: string }): Promise<void> => {
      await page.screenshot({ path: filePath, animations: 'allow' });
    },

    evaluateSource: async ({ source }: { source: string }): Promise<string> => {
      const evaluated: unknown = await page.evaluate(source);
      if (evaluated === undefined) {
        return 'undefined';
      }
      return JSON.stringify(evaluated);
    },

    readConsoleSince: ({ fromIndex }: { fromIndex: number }): readonly string[] =>
      consoleLines.slice(fromIndex),
    readNetworkSince: ({ fromIndex }: { fromIndex: number }): readonly string[] =>
      networkLines.slice(fromIndex),
    readWebsocketSince: ({ fromIndex }: { fromIndex: number }): readonly string[] =>
      websocketLines.slice(fromIndex),

    readDom: async ({
      target,
      fields,
      text,
    }: {
      target: string;
      fields: readonly DomField[] | null;
      text: DomTextMode | null;
    }): Promise<DomReading> => {
      const raw: unknown = await page.evaluate(domReader.readSource({ target, text }));
      return domReader.toReading({ raw, fields });
    },

    checkRootPresent: async (): Promise<boolean> => {
      const raw: unknown = await page.evaluate(rootChecker.checkSource());
      return rootChecker.toResult({ raw });
    },

    setViewport: async ({ width, height }: { width: number; height: number }): Promise<void> => {
      await page.setViewportSize({ width, height });
    },

    addInitScript: async ({ source }: { source: string }): Promise<void> => {
      await page.addInitScript({ content: source });
    },

    readStorage: async ({ prefix }: { prefix: string }): Promise<StorageReading> => {
      const raw: unknown = await page.evaluate(
        (p) => ({
          origin: window.location.origin,
          local: Object.fromEntries(
            Object.keys(window.localStorage)
              .filter((k) => k.startsWith(p))
              .map((k) => [k, window.localStorage.getItem(k)]),
          ),
          session: Object.fromEntries(
            Object.keys(window.sessionStorage)
              .filter((k) => k.startsWith(p))
              .map((k) => [k, window.sessionStorage.getItem(k)]),
          ),
        }),
        prefix,
      );
      return storageReadingContract.parse(raw);
    },

    clearStorage: async (): Promise<void> => {
      await page.evaluate(() => {
        window.localStorage.clear();
        window.sessionStorage.clear();
      });
    },

    pasteMatch: async ({
      target,
      within,
      filePath,
      value,
      timeoutMs,
    }: {
      target: string;
      within?: string;
      filePath: string | null;
      value: string | null;
      timeoutMs: number;
    }): Promise<void> => {
      const payload = pastePayloadLayerBroker({ filePath, value });
      const scoped = within === undefined ? target : `${within} ${target}`;
      await page.locator(scoped).focus({ timeout: timeoutMs });
      // A real Ctrl+V is the only paste that arrives with isTrusted true, so the payload goes to
      // the page's own clipboard first and the keypress pastes it.
      await page.evaluate(async (clip) => {
        if (clip.kind === 'text') {
          await navigator.clipboard.writeText(clip.text);
          return;
        }
        const binaryString = atob(clip.base64);
        const bytes = Uint8Array.from(binaryString, (char) => char.charCodeAt(0));
        const blob = new Blob([bytes], { type: clip.mimeType });
        await navigator.clipboard.write([new ClipboardItem({ [clip.mimeType]: blob })]);
      }, payload);
      await page.keyboard.press('ControlOrMeta+V');
    },

    pasteRef: async ({
      ref,
      filePath,
      value,
      timeoutMs,
    }: {
      ref: number;
      filePath: string | null;
      value: string | null;
      timeoutMs: number;
    }): Promise<void> => {
      const payload = pastePayloadLayerBroker({ filePath, value });
      await page.evaluate(refRegistry.stampSource({ ref }));
      try {
        await page.locator(refRegistry.targetSelector()).focus({ timeout: timeoutMs });
      } finally {
        await page.evaluate(refRegistry.unstampSource()).catch((error: unknown) => {
          stderr.write(
            `[browser-session-launch-broker] unstamp after pasteRef failed: ${String(error)}\n`,
          );
        });
      }
      // A real Ctrl+V is the only paste that arrives with isTrusted true, so the payload goes to
      // the page's own clipboard first and the keypress pastes it.
      await page.evaluate(async (clip) => {
        if (clip.kind === 'text') {
          await navigator.clipboard.writeText(clip.text);
          return;
        }
        const binaryString = atob(clip.base64);
        const bytes = Uint8Array.from(binaryString, (char) => char.charCodeAt(0));
        const blob = new Blob([bytes], { type: clip.mimeType });
        await navigator.clipboard.write([new ClipboardItem({ [clip.mimeType]: blob })]);
      }, payload);
      await page.keyboard.press('ControlOrMeta+V');
    },

    videoAction: async ({ action }: { action: VideoAction }): Promise<VideoResult> => {
      if (action === 'start') {
        videoState.isRecording = true;
        return videoResultContract.parse({
          status: 'started',
          path: null,
        });
      }

      videoState.isRecording = false;
      const video = page.video();
      const videoPath = (video === null ? null : await video.path()) ?? join(evidencePath, 'video');

      return videoResultContract.parse({
        status: 'stopped',
        path: videoPath,
      });
    },

    bufferLengths: (): BufferLengths =>
      bufferLengthsContract.parse({
        consoleLines: consoleLines.length,
        networkLines: networkLines.length,
        websocketLines: websocketLines.length,
      }),

    close: async (): Promise<void> => {
      await browser.close();
    },
  };
};
