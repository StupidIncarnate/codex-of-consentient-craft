import { callerCwdScanCursorStatics } from './caller-cwd-scan-cursor-statics';

describe('callerCwdScanCursorStatics', () => {
  it('VALID: {limits.maxEntries} => is a positive integer', () => {
    expect(callerCwdScanCursorStatics.limits.maxEntries).toBe(8);
  });
});
