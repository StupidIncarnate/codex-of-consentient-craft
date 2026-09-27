/**
 * PURPOSE: Decides whether a lint run should pay for the whole-repo platform-crossing and
 * duplicate-install checks. Both checks always walk the WHOLE repo when they run at all — this
 * guard decides only whether a SCOPED run (a file list after `--`, however it got there) is worth
 * triggering them for. A scope naming a `package.json` or a file under `packages/@gateway/` touches
 * what either check actually reads (dependency manifests, gateway source); every other scoped run
 * skips both, and an unscoped run (the whole repo) always triggers them.
 *
 * USAGE:
 * hasPlatformDedupeScopeTriggerGuard({ passthrough: undefined });
 * // Returns true — no file scope means the whole repo
 * hasPlatformDedupeScopeTriggerGuard({ passthrough: ['packages/@gateway/npm/package.json'] });
 * // Returns true — the scope names a gateway file
 * hasPlatformDedupeScopeTriggerGuard({ passthrough: ['packages/web/src/index.ts'] });
 * // Returns false — scoped to an ordinary file outside the gateway
 */

import type { WardConfig } from '../../contracts/ward-config/ward-config-contract';

const GATEWAY_FOLDER_PREFIX = 'packages/@gateway';

export const hasPlatformDedupeScopeTriggerGuard = ({
  passthrough,
}: {
  passthrough?: WardConfig['passthrough'];
}): boolean => {
  const hasPassthrough = Array.isArray(passthrough) && passthrough.length > 0;
  if (!hasPassthrough) {
    return true;
  }

  return passthrough.some((arg) => {
    const value = String(arg);
    return (
      value === 'package.json' ||
      value.endsWith('/package.json') ||
      value === GATEWAY_FOLDER_PREFIX ||
      value.startsWith(`${GATEWAY_FOLDER_PREFIX}/`)
    );
  });
};
