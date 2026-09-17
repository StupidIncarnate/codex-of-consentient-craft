import { hookPersistentRunnerHarness } from '../../test/harnesses/hook-runner/hook-persistent-runner.harness';

describe('start-agy-stop-hook', () => {
  const persistentRunner = hookPersistentRunnerHarness();

  beforeAll(async () => {
    await persistentRunner.start({ hookName: 'start-agy-stop-hook' });
  });

  afterAll(async () => {
    await persistentRunner.stop();
  });

  it('VALID: idle subagent => exits 0 with stop decision in stdout', async () => {
    const hookData = {
      fullyIdle: true,
    };

    const result = await persistentRunner.runHook({ hookData });

    expect(result).toStrictEqual({
      exitCode: 0,
      stdout: JSON.stringify({ decision: 'stop' }),
      stderr: '',
    });
  });

  it('INVALID: running background tasks => exits 0 with continue decision in stdout', async () => {
    const hookData = {
      fullyIdle: false,
    };

    const result = await persistentRunner.runHook({ hookData });

    expect(result.exitCode).toBe(0);
    const parsed = JSON.parse(result.stdout) as { decision: string };
    expect(parsed.decision).toBe('continue');
  });
});
