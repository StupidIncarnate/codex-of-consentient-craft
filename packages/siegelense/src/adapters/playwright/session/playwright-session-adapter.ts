/**
 * PURPOSE: Launches one throwaway Chromium instance against `baseUrl` and closes over it as the
 * `BrowserSession` facade every step-running broker drives — the ONLY file in this package allowed
 * to import `@playwright/test`, so every `Page`/`Browser`/`Locator` type it touches stays inside
 * this one folder. `packages/web/test/siege-driver/siege-lane.ts` lines 204-341 is the measured
 * shape for the launch and every listener; `listenersLayerAdapter` builds the JSON line for each one
 * from plain values this file extracts, so the npm boundary stays in exactly one place. Targeting
 * methods (`countMatches`, `clickMatch`, `fillMatch`, `waitForMatch`) never call `.first()`/`.last()`
 * — `within` and `target` compose into ONE CSS descendant selector Playwright resolves in strict
 * mode, which is what leaves the ambiguity decision to the caller instead of silently picking a
 * match.
 *
 * USAGE:
 * const session = await playwrightSessionAdapter({ baseUrl: 'http://localhost:5173', evidencePath });
 * const count = await session.countMatches({ target: '[data-testid="PIXEL_BTN"]' });
 * await session.close();
 */

import * as os from 'os';
import * as path from 'path';

import { chromium } from '@playwright/test';
import { z } from 'zod';
import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, ContentText } from '@dungeonmaster/shared/contracts';

import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import { locatorStateContract } from '../../../contracts/locator-state/locator-state-contract';
import { driverStatics } from '../../../statics/driver/driver-statics';
import { stepCandidateContract } from '../../../contracts/step-candidate/step-candidate-contract';
import type { StepCandidate } from '../../../contracts/step-candidate/step-candidate-contract';
import type {
  BrowserSession,
  BufferLengths,
  MatchCount,
} from '../../../contracts/browser-session/browser-session-contract';
import { listenersLayerAdapter } from './listeners-layer-adapter';

// Re-declared locally rather than imported: `browser-session-contract.ts` keeps its own parsing
// contracts private (leading underscore, no export) because the facade's data half is `{}` — a
// caller brands its own numbers, the same way `browser-session.stub.ts` does.
const matchCountContract = z.number().int().nonnegative().brand<'MatchCount'>();
const bufferLineCountContract = z.number().int().nonnegative().brand<'BufferLineCount'>();

// A zero-match error names the near-miss testIds on the page; this bounds that listing so a
// testid-dense screen does not post hundreds of names into one error message.
const NEAREST_NAMES_LIMIT = 50;

// Walks up from each match for the nearest `data-testid` ancestor (own text nodes only, never
// `textContent` — a recursive read once pulled a whole stylesheet into one reading) and formats its
// rect as `(x,y) WxH`, matching `stepCandidateContract`'s own example. `querySelectorAll` only, on
// both the `within` scope and the `target` — a bare `querySelector` silently returns match one,
// which is `.first()` again wearing a different name.
const DESCRIBE_MATCHES_SOURCE = `(params) => {
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
        text += node.textContent || '';
      }
    });
    return {
      index,
      within: nearest,
      text,
      rect: '(' + Math.round(rect.x) + ',' + Math.round(rect.y) + ') ' + Math.round(rect.width) + 'x' + Math.round(rect.height),
    };
  });
}`;

const NEAREST_NAMES_SOURCE = `() => Array.from(document.querySelectorAll('[data-testid]')).map((element) => element.getAttribute('data-testid')).filter((value) => value !== null)`;

export const playwrightSessionAdapter = async ({
  baseUrl,
  // Accepted for signature parity with the lane boot broker's other process launches; `capture`
  // takes a caller-resolved filePath directly, so this chunk's browser session has no read of its
  // own home yet.
  evidencePath: _evidencePath,
}: {
  baseUrl: string;
  evidencePath: AbsoluteFilePath;
}): Promise<BrowserSession> => {
  process.env.PLAYWRIGHT_BROWSERS_PATH ??= path.join(os.homedir(), '.cache', 'ms-playwright');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: baseUrl });
  // A real Ctrl+V is the only paste that arrives with isTrusted true, and it needs the clipboard
  // to be readable from the page's own origin.
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: baseUrl });
  const page = await context.newPage();

  const consoleLines: ContentText[] = [];
  const networkLines: ContentText[] = [];
  const websocketLines: ContentText[] = [];
  const linesBuild = listenersLayerAdapter();

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

  page.on('response', (response) => {
    const request = response.request();
    const resourceType = request.resourceType();
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
        process.stderr.write(
          `[playwright-session-adapter] response capture failed: ${String(error)}\n`,
        );
      });
  });

  page.on('requestfailed', (request) => {
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
              : contentTextContract.parse('<binary>'),
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
              : contentTextContract.parse('<binary>'),
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
      const raw = await page.evaluate(`(${DESCRIBE_MATCHES_SOURCE})(${params})`);
      return z.array(stepCandidateContract).parse(raw);
    },

    nearestNames: async ({
      // The zero-match error names every testid on the page, not a subset filtered by the target
      // that just failed to match — see the acceptance criteria's "simple querySelectorAll read".
      target: _target,
    }: {
      target: string;
    }): Promise<readonly ContentText[]> => {
      // Self-invoked for the same reason describeMatches is, above — a bare `() => ...` source
      // string is never called by Playwright at all, so it takes no `arg` to begin with.
      const raw = await page.evaluate(`(${NEAREST_NAMES_SOURCE})()`);
      const parsed = z.array(contentTextContract).parse(raw);
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

    capture: async ({ filePath }: { filePath: string }): Promise<void> => {
      await page.screenshot({ path: filePath, animations: 'disabled', caret: 'hide' });
    },

    evaluateSource: async ({ source }: { source: string }): Promise<ContentText> => {
      const evaluated: unknown = await page.evaluate(source);
      if (evaluated === undefined) {
        return contentTextContract.parse('undefined');
      }
      return contentTextContract.parse(JSON.stringify(evaluated));
    },

    readConsoleSince: ({ fromIndex }: { fromIndex: number }): readonly ContentText[] =>
      consoleLines.slice(fromIndex),
    readNetworkSince: ({ fromIndex }: { fromIndex: number }): readonly ContentText[] =>
      networkLines.slice(fromIndex),
    readWebsocketSince: ({ fromIndex }: { fromIndex: number }): readonly ContentText[] =>
      websocketLines.slice(fromIndex),

    bufferLengths: (): BufferLengths => ({
      consoleLines: bufferLineCountContract.parse(consoleLines.length),
      networkLines: bufferLineCountContract.parse(networkLines.length),
      websocketLines: bufferLineCountContract.parse(websocketLines.length),
    }),

    close: async (): Promise<void> => {
      await browser.close();
    },
  };
};
