import { HookPostEditFlow } from './hook-post-edit-flow';

describe('HookPostEditFlow', () => {
  describe('delegation to responder', () => {
    it('ERROR: {inputData: invalid JSON} => returns exitCode 1 with error in stderr', async () => {
      const result = await HookPostEditFlow({ inputData: 'not json' });

      expect(result).toStrictEqual({
        exitCode: 1,
        stdout: '',
        stderr: expect.stringMatching(/^[\s\S]*Hook error[\s\S]*$/su),
      });
    });

    it('ERROR: {inputData: unsupported hook event} => returns exitCode 1 with error in stderr', async () => {
      const inputData = JSON.stringify({
        session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        transcript_path: '/tmp/transcript.jsonl',
        cwd: process.cwd(),
        hook_event_name: 'PreToolUse',
        tool_name: 'Write',
        tool_input: { file_path: '/test/file.ts', content: '' },
      });

      const result = await HookPostEditFlow({ inputData });

      expect(result).toStrictEqual({
        exitCode: 1,
        stdout: '',
        stderr: expect.stringMatching(/^[\s\S]*Unsupported hook event[\s\S]*$/su),
      });
    });
  });
});
