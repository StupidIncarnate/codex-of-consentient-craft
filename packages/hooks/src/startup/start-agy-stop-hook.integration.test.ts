import { AgyStopHookDataStub } from '../contracts/agy-stop-hook-data/agy-stop-hook-data.stub';
import { subagentStopBlockMessageStatics } from '../statics/subagent-stop-block-message/subagent-stop-block-message-statics';
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
    const hookData = AgyStopHookDataStub({
      fullyIdle: true,
    });

    const result = await persistentRunner.runHook({ hookData });

    expect(result).toStrictEqual({
      exitCode: 0,
      stdout: JSON.stringify({ decision: 'stop' }),
      stderr: '',
    });
  });

  it('INVALID: running background tasks => exits 0 with continue decision in stdout', async () => {
    const hookData = AgyStopHookDataStub({
      fullyIdle: false,
    });

    const result = await persistentRunner.runHook({ hookData });

    expect(result).toStrictEqual({
      exitCode: 0,
      stdout: JSON.stringify({
        decision: 'continue',
        reason: subagentStopBlockMessageStatics.backgroundTaskMessage,
      }),
      stderr: '',
    });
  });
});
