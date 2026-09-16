/**
 * PURPOSE: Test setup helper for callerCwdScanCursorState — the state itself runs real (a plain
 * in-memory Map, nothing to mock), so this only exposes an explicit clear for test isolation.
 *
 * USAGE:
 * const proxy = callerCwdScanCursorStateProxy();
 * proxy.setupClear();
 */

import { callerCwdScanCursorState } from './caller-cwd-scan-cursor-state';

export const callerCwdScanCursorStateProxy = (): {
  setupClear: () => void;
} => ({
  setupClear: (): void => {
    callerCwdScanCursorState.clear();
  },
});
