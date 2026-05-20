import { PostToolUseHookStub } from '../contracts/post-tool-use-hook-data/post-tool-use-hook-data.stub';
import { ExecResultStub } from '../contracts/exec-result/exec-result.stub';
import { hookRunnerHarness } from '../../test/harnesses/hook-runner/hook-runner.harness';

describe('start-post-ask-question-hook', () => {
  const runner = hookRunnerHarness();

  it('VALID: {non-AskUserQuestion PostToolUse payload} => exits 0', () => {
    const hookData = PostToolUseHookStub({ tool_name: 'Write' });

    const result = runner.runHook({ hookName: 'start-post-ask-question-hook', hookData });

    expect(result.exitCode).toBe(0);
  });

  it('ERROR: {invalid JSON on stdin} => exits 2 (blocking, stderr fed back to Claude)', () => {
    const result = runner.runHookRaw({
      hookName: 'start-post-ask-question-hook',
      input: ExecResultStub({ stdout: 'not json' }).stdout,
    });

    expect(result.status).toBe(2);
  });
});
