import { HookAgyStopFlow } from './hook-agy-stop-flow';

describe('HookAgyStopFlow', () => {
  it('VALID: {inputData: fullyIdle false JSON} => returns exitCode 0 with continue decision', async () => {
    const inputData = JSON.stringify({
      fullyIdle: false,
    });

    const result = await HookAgyStopFlow({ inputData });

    expect(result.exitCode).toBe(0);
    const parsed = JSON.parse(result.stdout) as { decision: string };
    expect(parsed.decision).toBe('continue');
  });

  it('VALID: {inputData: fullyIdle true without transcript} => returns exitCode 0 with stop decision', async () => {
    const inputData = JSON.stringify({
      fullyIdle: true,
    });

    const result = await HookAgyStopFlow({ inputData });

    expect(result).toStrictEqual({
      exitCode: 0,
      stdout: JSON.stringify({ decision: 'stop' }),
      stderr: '',
    });
  });

  it('INVALID: {inputData: invalid JSON} => falls back to stop gracefully', async () => {
    const result = await HookAgyStopFlow({ inputData: 'invalid json' });

    expect(result).toStrictEqual({
      exitCode: 0,
      stdout: JSON.stringify({ decision: 'stop' }),
      stderr: '',
    });
  });
});
