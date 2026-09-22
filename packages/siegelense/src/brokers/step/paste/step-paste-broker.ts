/**
 * PURPOSE: Drives the `paste` step against an element already known to be reachable —
 * `stepDispatchBroker` runs `stepTargetResolveBroker` first, so this broker never re-checks
 * the count or the ref's state itself. Focuses the element (target/within or ref), writes
 * payload (file contents or text value) to browser clipboard, and simulates ControlOrMeta+V.
 * Returns a ContentText reading describing what was pasted and into which target.
 *
 * **The paste's own timeout bounds the action; `waitForSettle` bounds what happens after it.**
 * They answer different questions — whether the clipboard write and the keystroke landed at all,
 * and whether the page finished reacting to it — so a paste that lands but leaves the page
 * mid-update still gets reported. `waitForSettle` never throws on `settled: false`; this broker
 * reads that flag and, only when it is false, appends the reason and the still-moving signals to
 * the reading it returns, using `driverStatics.settle`'s quiet window, ceiling and poll cadence
 * rather than inventing its own.
 *
 * USAGE:
 * await stepPasteBroker({
 *   session,
 *   target: '[data-testid="INPUT"]',
 *   within: null,
 *   ref: null,
 *   filePath: null,
 *   value: 'hello',
 *   timeoutMs: null,
 * });
 * // Returns ContentText 'pasted "hello" into [data-testid="INPUT"]'
 *
 * await stepPasteBroker({
 *   session,
 *   target: '[data-testid="SLOW_INPUT"]',
 *   within: null,
 *   ref: null,
 *   filePath: null,
 *   value: 'hello',
 *   timeoutMs: null,
 * });
 * // If the page never settles: 'pasted "hello" into [data-testid="SLOW_INPUT"]; did not settle
 * // after 5000ms (still moving: network)'
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import { driverStatics } from '../../../statics/driver/driver-statics';
import { pasteStatics } from '../../../statics/paste/paste-statics';
import { settleReadingRenderTransformer } from '../../../transformers/settle-reading-render/settle-reading-render-transformer';

export const stepPasteBroker = async ({
  session,
  target,
  within,
  ref,
  filePath,
  value,
  timeoutMs,
}: {
  session: BrowserSession;
  target: string | null;
  within: string | null;
  ref: number | null;
  filePath: string | null;
  value: string | null;
  timeoutMs: number | null;
}): Promise<ContentText> => {
  const resolvedTimeoutMs = timeoutMs ?? driverStatics.run.defaultStepTimeoutMs;

  if (ref !== null) {
    await session.pasteRef({
      ref,
      filePath,
      value,
      timeoutMs: resolvedTimeoutMs,
    });
    const settleReading = await session.waitForSettle({
      quietWindowMs: driverStatics.settle.quietWindowMs,
      ceilingMs: driverStatics.settle.ceilingMs,
      pollMs: driverStatics.settle.pollMs,
    });
    const reading =
      filePath === null
        ? pasteStatics.templates.text.ref
            .replace('{value}', value ?? '')
            .replace('{ref}', String(ref))
        : pasteStatics.templates.file.ref
            .replace('{filePath}', filePath)
            .replace('{ref}', String(ref));
    return settleReadingRenderTransformer({
      baseMessage: contentTextContract.parse(reading),
      settleReading,
    });
  }

  if (target === null) {
    throw new Error(
      'step-paste-broker: a paste reached the driver with neither a `target` nor a `ref`. `stepContract` refuses that combination, so this means a step was built without going through it.',
    );
  }

  const matchParams =
    within === null
      ? { target, filePath, value, timeoutMs: resolvedTimeoutMs }
      : { target, within, filePath, value, timeoutMs: resolvedTimeoutMs };

  await session.pasteMatch(matchParams);
  const settleReading = await session.waitForSettle({
    quietWindowMs: driverStatics.settle.quietWindowMs,
    ceilingMs: driverStatics.settle.ceilingMs,
    pollMs: driverStatics.settle.pollMs,
  });

  if (within !== null) {
    const reading =
      filePath === null
        ? pasteStatics.templates.text.within
            .replace('{value}', value ?? '')
            .replace('{target}', target)
            .replace('{within}', within)
        : pasteStatics.templates.file.within
            .replace('{filePath}', filePath)
            .replace('{target}', target)
            .replace('{within}', within);
    return settleReadingRenderTransformer({
      baseMessage: contentTextContract.parse(reading),
      settleReading,
    });
  }

  const reading =
    filePath === null
      ? pasteStatics.templates.text.target
          .replace('{value}', value ?? '')
          .replace('{target}', target)
      : pasteStatics.templates.file.target
          .replace('{filePath}', filePath)
          .replace('{target}', target);
  return settleReadingRenderTransformer({
    baseMessage: contentTextContract.parse(reading),
    settleReading,
  });
};
