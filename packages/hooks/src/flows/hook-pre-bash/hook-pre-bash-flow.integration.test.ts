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

      expect(result).toStrictEqual({
        exitCode: 2,
        stdout: '',
        stderr: expect.stringMatching(/^.*Blocked: direct jest invocation.*$/su),
      });
    });

    it('VALID: {inputData: piped ward command JSON} => returns exitCode 0 with updatedInput in stdout', () => {
      const inputData = JSON.stringify({
        session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        transcript_path: '/tmp/transcript.jsonl',
        cwd: process.cwd(),
        hook_event_name: 'PreToolUse',
        tool_name: 'Bash',
        tool_input: { command: 'npm run ward -- --only unit | tail -80' },
      });

      const result = HookPreBashFlow({ inputData });

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            updatedInput: {
              command: 'npm run ward -- --only unit',
            },
          },
        }),
        stderr: '',
      });
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

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
    });

    it('VALID: {inputData: ward command with low timeout} => returns exitCode 0 with updatedInput timeout in stdout', () => {
      const inputData = JSON.stringify({
        session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        transcript_path: '/tmp/transcript.jsonl',
        cwd: process.cwd(),
        hook_event_name: 'PreToolUse',
        tool_name: 'Bash',
        tool_input: { command: 'npm run ward', timeout: 120_000 },
      });

      const result = HookPreBashFlow({ inputData });

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            updatedInput: { timeout: 600_000 },
          },
        }),
        stderr: '',
      });
    });

    it('VALID: {inputData: ward command with no timeout} => returns exitCode 0 with updatedInput timeout in stdout', () => {
      const inputData = JSON.stringify({
        session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        transcript_path: '/tmp/transcript.jsonl',
        cwd: process.cwd(),
        hook_event_name: 'PreToolUse',
        tool_name: 'Bash',
        tool_input: { command: 'npm run ward -- --only unit -- packages/hooks' },
      });

      const result = HookPreBashFlow({ inputData });

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            updatedInput: { timeout: 600_000 },
          },
        }),
        stderr: '',
      });
    });

    it('VALID: {inputData: ward command with sufficient timeout} => returns exitCode 0 with no updatedInput', () => {
      const inputData = JSON.stringify({
        session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        transcript_path: '/tmp/transcript.jsonl',
        cwd: process.cwd(),
        hook_event_name: 'PreToolUse',
        tool_name: 'Bash',
        tool_input: { command: 'npm run ward', timeout: 600_000 },
      });

      const result = HookPreBashFlow({ inputData });

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
    });

    it('ERROR: {inputData: invalid JSON} => returns exitCode 1 with error in stderr', () => {
      const result = HookPreBashFlow({ inputData: 'not json' });

      expect(result).toStrictEqual({
        exitCode: 1,
        stdout: '',
        stderr: expect.stringMatching(/^.*Hook error.*$/su),
      });
    });
  });
});
