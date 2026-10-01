import { HookPostBashFlow } from './hook-post-bash-flow';

describe('HookPostBashFlow', () => {
  it('VALID: {Bash command "ls -la"} => returns silent ExecResult with exitCode 0', async () => {
    const inputData = JSON.stringify({
      hook_event_name: 'PostToolUse',
      tool_name: 'Bash',
      session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      transcript_path: '/tmp/transcript.jsonl',
      cwd: '/tmp/hook-flow-project',
      tool_input: { command: 'ls -la' },
    });

    const result = await HookPostBashFlow({ inputData });

    expect(result).toStrictEqual({ stdout: '', stderr: '', exitCode: 0 });
  });

  it('ERROR: {inputData: not JSON} => returns exitCode 0 with the parse error on stderr', async () => {
    const result = await HookPostBashFlow({ inputData: 'not json' });

    expect(result).toStrictEqual({
      stdout: '',
      stderr: `[post-bash] Unexpected token 'o', "not json" is not valid JSON\n`,
      exitCode: 0,
    });
  });
});
