import { hookPersistentRunnerHarness } from '../../test/harnesses/hook-runner/hook-persistent-runner.harness';

describe('start-agy-pre-tool-hook', () => {
  const persistentRunner = hookPersistentRunnerHarness();

  beforeAll(async () => {
    await persistentRunner.start({ hookName: 'start-agy-pre-tool-hook' });
  });

  afterAll(async () => {
    await persistentRunner.stop();
  });

  it('VALID: allowed command => exits 0 with allow decision in stdout', async () => {
    const hookData = {
      toolCall: {
        name: 'run_command',
        args: { CommandLine: 'git status' },
      },
    };

    const result = await persistentRunner.runHook({ hookData });

    expect(result).toStrictEqual({
      exitCode: 0,
      stdout: JSON.stringify({ decision: 'allow' }),
      stderr: '',
    });
  });

  it('INVALID: blocked search tool => exits 0 with deny decision in stdout', async () => {
    const hookData = {
      toolCall: {
        name: 'grep_search',
        args: { Query: 'something' },
      },
    };

    const result = await persistentRunner.runHook({ hookData });

    expect(result.exitCode).toBe(0);
    const parsed = JSON.parse(result.stdout) as { decision: string };
    expect(parsed.decision).toBe('deny');
  });
});
