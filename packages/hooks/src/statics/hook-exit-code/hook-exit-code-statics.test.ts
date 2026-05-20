import { hookExitCodeStatics } from './hook-exit-code-statics';

describe('hookExitCodeStatics', () => {
  it('VALID: {full static export} => matches Claude Code hook exit-code contract', () => {
    expect(hookExitCodeStatics).toStrictEqual({
      success: 0,
      blockingFailure: 2,
    });
  });
});
