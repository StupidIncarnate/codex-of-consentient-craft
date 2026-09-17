/**
 * PURPOSE: Drives the `until` step — "wait on something other than a locator state"
 * (siegelense-tooling.md line 2691) — by routing on which of the five condition fields is non-null
 * and owning the ceiling (`timeoutMs ?? driverStatics.run.defaultStepTimeoutMs`), the same contract
 * `stepWaitForBroker` keeps: every form throws `UntilCeilingHitError` once its ceiling passes, and a
 * real error underneath propagates unchanged — the two Playwright-owned forms tell those apart with
 * `isPlaywrightTimeoutErrorGuard`, because only a CEILING may become `RunStatus`'s `'timeout'` and
 * this is the one wait here that hands an unresolved selector straight to a strict locator. Takes
 * the whole `LaneSession`, like `stepSeedBroker`,
 * because the `file` form touches disk and never a page (R13 — an operational flow has no screen and
 * still writes files) — the browser narrowing for the other four forms happens IN HERE, per form,
 * rather than above this call the way `stepStatics.verbs.browser` narrows every other verb.
 * `console`/`response` scan from `browserWindowStart` — the RUN's own window, computed once by
 * `runExecuteBroker` before its whole step loop — rather than a fresh `session.bufferLengths()` read
 * at whatever moment this one step happens to start: a match written by an EARLIER STEP of this same
 * run (a `click`'s own POST, say) sits inside that window and must resolve, not time out.
 *
 * USAGE:
 * await stepUntilBroker({
 *   lane, visible: SelectorStub(), response: null, file: null, predicate: null, console: null,
 *   timeoutMs: 20000, browserWindowStart: null,
 * });
 * // Waits for the selector to become visible and returns a reading naming how long it took, or
 * // throws UntilCeilingHitError once the ceiling passes
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { BufferLengths } from '../../../contracts/browser-session/browser-session-contract';
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import type { UntilConsolePattern } from '../../../contracts/until-console-pattern/until-console-pattern-contract';
import type { UntilFilePath } from '../../../contracts/until-file-path/until-file-path-contract';
import type { UntilResponse } from '../../../contracts/until-response/until-response-contract';
import { BrowserStepUnsupportedError } from '../../../errors/browser-step-unsupported/browser-step-unsupported-error';
import { UntilCeilingHitError } from '../../../errors/until-ceiling-hit/until-ceiling-hit-error';
import { isPlaywrightTimeoutErrorGuard } from '../../../guards/is-playwright-timeout-error/is-playwright-timeout-error-guard';
import { driverStatics } from '../../../statics/driver/driver-statics';
import { untilBufferMatchLayerBroker } from './until-buffer-match-layer-broker';
import { untilFileWaitLayerBroker } from './until-file-wait-layer-broker';

export const stepUntilBroker = async ({
  lane,
  visible,
  response,
  file,
  predicate,
  console: consolePattern,
  timeoutMs,
  browserWindowStart,
}: {
  lane: LaneSession;
  visible: string | null;
  response: UntilResponse | null;
  file: UntilFilePath | null;
  predicate: string | null;
  console: UntilConsolePattern | null;
  timeoutMs: number | null;
  browserWindowStart: BufferLengths | null;
}): Promise<ContentText> => {
  const resolvedTimeoutMs = timeoutMs ?? driverStatics.run.defaultStepTimeoutMs;

  // The one form R13 exists for: an operational flow has no screen and still writes files, so
  // `file` runs on a browserless lane exactly as it runs on `dungeonmaster-web` — checked before
  // the browser guard below, the same way `seed` is routed before `runVerbLayerBroker` narrows to
  // a live page.
  if (file !== null) {
    const startedAtMs = Date.now();
    return untilFileWaitLayerBroker({
      homePath: lane.homePath,
      file,
      startedAtMs,
      deadlineAtMs: startedAtMs + resolvedTimeoutMs,
      timeoutMs: resolvedTimeoutMs,
    });
  }

  const form =
    visible === null
      ? predicate === null
        ? consolePattern === null
          ? 'response'
          : 'console'
        : 'predicate'
      : 'visible';

  const { browser: session } = lane;
  if (session === null) {
    throw new BrowserStepUnsupportedError({ verb: 'until', specName: lane.specName, form });
  }

  const startedAtMs = Date.now();

  if (visible !== null) {
    try {
      await session.waitForMatch({
        target: visible,
        state: 'visible',
        timeoutMs: resolvedTimeoutMs,
      });
    } catch (error: unknown) {
      // Only a CEILING is a timeout. This is the one wait in the package that does not pre-resolve
      // its target — `waitFor` goes through `stepTargetResolveBroker` first, which is exactly why
      // `waitFor` cannot wait for an element to appear and this form can — so Playwright's strict
      // locator is what meets an ambiguous selector here, and it raises a strict-mode violation
      // rather than a TimeoutError. Rethrowing it unchanged keeps the run's verdict `failed` and
      // hands the walker Playwright's own message, which names both elements; folding it into a
      // ceiling would answer `timeout` and advise waiting longer for something already on the
      // screen twice.
      if (!isPlaywrightTimeoutErrorGuard({ error })) {
        throw error;
      }
      throw new UntilCeilingHitError({
        descriptor: `visible ${visible}`,
        timeoutMs: resolvedTimeoutMs,
        bufferNote: null,
      });
    }
    const waitedMs = Date.now() - startedAtMs;
    return contentTextContract.parse(`${visible} became visible after ${String(waitedMs)}ms`);
  }

  if (predicate !== null) {
    try {
      await session.waitForPredicate({ source: predicate, timeoutMs: resolvedTimeoutMs });
    } catch (error: unknown) {
      // Same rule, and the stakes are higher here: a predicate whose source throws — a typo, an
      // identifier the page does not define — rejects immediately, and reporting that as a ceiling
      // makes a BROKEN predicate indistinguishable from a false one. A walker would raise the
      // timeout forever against source that can never evaluate.
      if (!isPlaywrightTimeoutErrorGuard({ error })) {
        throw error;
      }
      throw new UntilCeilingHitError({
        descriptor: `predicate ${predicate}`,
        timeoutMs: resolvedTimeoutMs,
        bufferNote: null,
      });
    }
    const waitedMs = Date.now() - startedAtMs;
    return contentTextContract.parse(`predicate became true after ${String(waitedMs)}ms`);
  }

  if (consolePattern !== null) {
    // The RUN's own window start, never a fresh `session.bufferLengths()` read here — that would
    // measure from whatever the buffer holds at the moment THIS step starts, so a line written by
    // an earlier step of this same run (a `click`'s own console line, say) would sit before
    // `fromIndex` and never be seen. `session` being non-null (checked above) means the lane HAD a
    // browser for this whole run, so `runExecuteBroker` always supplies this non-null too — the
    // check below is the same defensive-throw shape as the "unreachable in practice" one at the
    // bottom of this file, naming the invariant rather than silently falling back to the stale read.
    if (browserWindowStart === null) {
      throw new Error(
        "step-until-broker: session is live but browserWindowStart is null — runExecuteBroker must always supply the run's own window when the lane has a browser",
      );
    }
    const fromIndex = browserWindowStart.consoleLines;
    return untilBufferMatchLayerBroker({
      kind: 'console',
      readSince: session.readConsoleSince,
      fromIndex,
      startedAtMs,
      deadlineAtMs: startedAtMs + resolvedTimeoutMs,
      timeoutMs: resolvedTimeoutMs,
      matches: (parsed) =>
        typeof parsed.text === 'string' && new RegExp(consolePattern, 'u').test(parsed.text),
      descriptor: `console matching /${consolePattern}/`,
      buildReading: ({ parsed, waitedMs }) =>
        contentTextContract.parse(
          `console line matching /${consolePattern}/ arrived after ${String(waitedMs)}ms — "${String(parsed.text)}"`,
        ),
    });
  }

  if (response !== null) {
    // Same reasoning as the `console` branch above: the RUN's own window start, not a fresh
    // `bufferLengths()` read at this step's own moment — a POST fired by an earlier `click` step in
    // this same run must already be inside the window `until { response }` scans.
    if (browserWindowStart === null) {
      throw new Error(
        "step-until-broker: session is live but browserWindowStart is null — runExecuteBroker must always supply the run's own window when the lane has a browser",
      );
    }
    const fromIndex = browserWindowStart.networkLines;
    return untilBufferMatchLayerBroker({
      kind: 'network',
      readSince: session.readNetworkSince,
      fromIndex,
      startedAtMs,
      deadlineAtMs: startedAtMs + resolvedTimeoutMs,
      timeoutMs: resolvedTimeoutMs,
      matches: (parsed) =>
        typeof parsed.method === 'string' &&
        parsed.method === response.method &&
        typeof parsed.url === 'string' &&
        parsed.url.includes(response.path),
      descriptor: `response ${response.method} ${response.path}`,
      buildReading: ({ parsed, waitedMs }) =>
        contentTextContract.parse(
          `${response.method} ${response.path} answered ${String(parsed.status)} after ${String(waitedMs)}ms`,
        ),
    });
  }

  // Unreachable in practice: `stepContract`'s own `.superRefine` already refuses a step where
  // zero or more than one of the five condition fields is set, so exactly one of the branches
  // above always returns. Named rather than left to fall off the end, so a bypassed contract
  // fails loudly instead of returning `undefined` from an async function.
  throw new Error(
    'step-until-broker: no until condition field was set — stepContract already refuses this',
  );
};
