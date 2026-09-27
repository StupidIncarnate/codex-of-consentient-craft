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

  it('EDGE: {process.exitCode: null} => returns undefined', () => {
    const original = process.exitCode;
    // `as never`: a newer `@types/node` allows this assignment for real; this repo's own pinned
    // version does not, so the deliberately-invalid cast keeps the test compiling under both.
    process.exitCode = null as never;

    const result = getExitCode();

    process.exitCode = original;

    expect(result).toBe(undefined);
  });
});
