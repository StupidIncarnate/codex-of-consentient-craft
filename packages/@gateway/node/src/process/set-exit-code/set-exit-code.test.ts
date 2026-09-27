import { setExitCode } from './set-exit-code';

describe('setExitCode', () => {
  it('VALID: {code: 2} => sets process.exitCode to that value', () => {
    const original = process.exitCode;

    setExitCode(2);

    const result = process.exitCode;
    process.exitCode = original;

    expect(result).toBe(2);
  });

  it('EMPTY: {code: undefined} => clears process.exitCode', () => {
    const original = process.exitCode;
    process.exitCode = 5;

    setExitCode(undefined);

    const result = process.exitCode;
    process.exitCode = original;

    expect(result).toBe(undefined);
  });
});
