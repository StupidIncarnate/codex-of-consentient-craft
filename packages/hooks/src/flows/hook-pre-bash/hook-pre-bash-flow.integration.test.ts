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
        stderr: 'Blocked: direct jest invocation. Use instead: `npm run ward -- --only test`\n',
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
              timeout: 600_000,
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

    // Claude Code treats `updatedInput` as a REPLACEMENT for the whole tool input, not a patch: a
    // payload carrying only `timeout` fails Bash's own schema validation and the tool call is
    // rejected outright with "The required parameter `command` is missing". So a timeout-only
    // decision still has to echo the command back verbatim.
    it('VALID: {inputData: ward command with low timeout} => updatedInput carries the command alongside the raised timeout', () => {
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
            updatedInput: { command: 'npm run ward', timeout: 600_000 },
          },
        }),
        stderr: '',
      });
    });

    it('VALID: {inputData: ward command with no timeout} => updatedInput carries the command alongside the raised timeout', () => {
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
            updatedInput: {
              command: 'npm run ward -- --only unit -- packages/hooks',
              timeout: 600_000,
            },
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
        stderr: expect.stringMatching(
          'Hook error: Unexpected token \'o\', "not json" is not valid JSON',
        ),
      });
    });
  });
});
