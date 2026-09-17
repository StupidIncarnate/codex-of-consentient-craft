import { HookAgyPreToolFlow } from './hook-agy-pre-tool-flow';

describe('HookAgyPreToolFlow', () => {
  it('VALID: {inputData: allowed command JSON} => returns exitCode 0 with allow decision', async () => {
    const inputData = JSON.stringify({
      toolCall: {
        name: 'run_command',
        args: { CommandLine: 'git status' },
      },
    });

    const result = await HookAgyPreToolFlow({ inputData });

    expect(result).toStrictEqual({
      exitCode: 0,
      stdout: JSON.stringify({ decision: 'allow' }),
      stderr: '',
    });
  });

  it('VALID: {inputData: blocked search JSON} => returns exitCode 0 with deny decision', async () => {
    const inputData = JSON.stringify({
      toolCall: {
        name: 'grep_search',
        args: { Query: 'pattern' },
      },
    });

    const result = await HookAgyPreToolFlow({ inputData });

    expect(result.exitCode).toBe(0);
    const parsedStdout = JSON.parse(result.stdout) as { decision: string };
    expect(parsedStdout.decision).toBe('deny');
  });

  it('INVALID: {inputData: invalid JSON} => falls back to allow gracefully', async () => {
    const result = await HookAgyPreToolFlow({ inputData: 'invalid json' });

    expect(result).toStrictEqual({
      exitCode: 0,
      stdout: JSON.stringify({ decision: 'allow' }),
      stderr: '',
    });
  });
});
