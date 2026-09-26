import { RunNotFoundError } from './run-not-found-error';

describe('RunNotFoundError', () => {
  it('VALID: {command: "lsof", code: "ENOENT", message: "spawn lsof ENOENT"} => carries command and code, message names both', () => {
    const error = new RunNotFoundError({
      command: 'lsof',
      code: 'ENOENT',
      message: 'spawn lsof ENOENT',
    });

    expect(error instanceof Error).toBe(true);
    expect({ command: error.command, code: error.code, message: error.message }).toStrictEqual({
      command: 'lsof',
      code: 'ENOENT',
      message: '"lsof" never started: spawn lsof ENOENT',
    });
  });

  it('EMPTY: {code: undefined} => carries undefined code', () => {
    const error = new RunNotFoundError({
      command: 'ghost',
      code: undefined,
      message: 'fork failed',
    });

    expect(error.code).toBe(undefined);
  });
});
