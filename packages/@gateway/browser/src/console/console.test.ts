import {
  console,
  consoleDebug,
  consoleError,
  consoleInfo,
  consoleLog,
  consoleWarn,
} from './console';

describe('#gateway/browser/console', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(console).toBe(globalThis.console);
  });

  it('VALID: {method wrappers} => the barrel re-exports each one as a function', () => {
    expect({ consoleDebug, consoleError, consoleInfo, consoleLog, consoleWarn }).toStrictEqual({
      consoleDebug: expect.any(Function),
      consoleError: expect.any(Function),
      consoleInfo: expect.any(Function),
      consoleLog: expect.any(Function),
      consoleWarn: expect.any(Function),
    });
  });
});
