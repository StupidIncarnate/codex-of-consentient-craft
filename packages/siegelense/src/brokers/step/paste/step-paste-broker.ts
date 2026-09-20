/**
 * PURPOSE: Drives the `paste` step against an element already known to be reachable —
 * `stepDispatchBroker` runs `stepTargetResolveBroker` first, so this broker never re-checks
 * the count or the ref's state itself. Focuses the element (target/within or ref), writes
 * payload (file contents or text value) to browser clipboard, and simulates ControlOrMeta+V.
 * Returns a ContentText reading describing what was pasted and into which target.
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
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import { driverStatics } from '../../../statics/driver/driver-statics';
import { pasteStatics } from '../../../statics/paste/paste-statics';

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
    const reading =
      filePath === null
        ? pasteStatics.templates.text.ref
            .replace('{value}', value ?? '')
            .replace('{ref}', String(ref))
        : pasteStatics.templates.file.ref
            .replace('{filePath}', filePath)
            .replace('{ref}', String(ref));
    return contentTextContract.parse(reading);
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
    return contentTextContract.parse(reading);
  }

  const reading =
    filePath === null
      ? pasteStatics.templates.text.target
          .replace('{value}', value ?? '')
          .replace('{target}', target)
      : pasteStatics.templates.file.target
          .replace('{filePath}', filePath)
          .replace('{target}', target);
  return contentTextContract.parse(reading);
};
