import { getExitCode } from './get-exit-code';

describe('getExitCode', () => {
  it('VALID: {process.exitCode: 3} => returns its current value', () => {
    const original = process.exitCode;
    process.exitCode = 3;

    const result = getExitCode();

    process.exitCode = original;

    expect(result).toBe(3);
  });

  it('EMPTY: {process.exitCode unset} => returns undefined', () => {
    const original = process.exitCode;
    process.exitCode = undefined;

    const result = getExitCode();

    process.exitCode = original;

    expect(result).toBe(undefined);
  });
});
