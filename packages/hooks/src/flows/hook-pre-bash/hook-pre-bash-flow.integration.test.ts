import { HookPreBashFlow } from './hook-pre-bash-flow';

describe('HookPreBashFlow', () => {
  describe('delegation to responder', () => {
    it('VALID: {inputData: blocked command JSON} => returns exitCode 2 with message in stderr', () => {
      const inputData = JSON.stringify({
        session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        transcript_path: '/tmp/transcript.jsonl',
        cwd: process.cwd(),
        hook_event_name: 'PreToolUse',
        tool_name: 'Bash',
        tool_input: { command: 'jest' },
      });

      const result = HookPreBashFlow({ inputData });

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toMatch(/Blocked: direct jest invocation/u);
    });

    it('VALID: {inputData: allowed command JSON} => returns exitCode 0 with empty stderr', () => {
      const inputData = JSON.stringify({
        session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        transcript_path: '/tmp/transcript.jsonl',
        cwd: process.cwd(),
        hook_event_name: 'PreToolUse',
        tool_name: 'Bash',
        tool_input: { command: 'echo hello' },
      });

      const result = HookPreBashFlow({ inputData });

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('');
    });

    it('ERROR: {inputData: invalid JSON} => returns exitCode 1 with error in stderr', () => {
      const result = HookPreBashFlow({ inputData: 'not json' });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toMatch(/Hook error/u);
    });
  });
});
