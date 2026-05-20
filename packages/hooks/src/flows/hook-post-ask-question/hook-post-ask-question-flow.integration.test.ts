import { HookPostAskQuestionFlow } from './hook-post-ask-question-flow';

describe('HookPostAskQuestionFlow', () => {
  it('VALID: {tool_name is not AskUserQuestion} => returns ExecResult with exitCode 0', async () => {
    const inputData = JSON.stringify({
      hook_event_name: 'PostToolUse',
      tool_name: 'Write',
      session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      transcript_path: '/tmp/transcript.jsonl',
      cwd: process.cwd(),
      tool_input: { file_path: '/tmp/x', content: '' },
      tool_response: { type: 'create', filePath: '/tmp/x' },
    });

    const result = await HookPostAskQuestionFlow({ inputData });

    expect(result).toStrictEqual({
      stdout: '',
      stderr: '',
      exitCode: 0,
    });
  });
});
