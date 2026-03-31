import { HookPreSearchFlow } from './hook-pre-search-flow';

describe('HookPreSearchFlow', () => {
  describe('blocked: exploratory searches', () => {
    it('VALID: {Grep, pattern: "permission", files_with_matches} => returns exitCode 2 with discover guide', () => {
      const inputData = JSON.stringify({
        session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        transcript_path: '/tmp/transcript.jsonl',
        cwd: process.cwd(),
        hook_event_name: 'PreToolUse',
        tool_name: 'Grep',
        tool_input: { pattern: 'permission', output_mode: 'files_with_matches' },
      });

      const result = HookPreSearchFlow({ inputData });

      expect(result).toStrictEqual({
        exitCode: 2,
        stdout: '',
        stderr: expect.stringMatching(/^BLOCKED: Use the `discover` MCP tool.*\n$/su),
      });
    });

    it('VALID: {Glob, pattern: "**/*.ts"} => returns exitCode 2 with discover guide', () => {
      const inputData = JSON.stringify({
        session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        transcript_path: '/tmp/transcript.jsonl',
        cwd: process.cwd(),
        hook_event_name: 'PreToolUse',
        tool_name: 'Glob',
        tool_input: { pattern: '**/*.ts' },
      });

      const result = HookPreSearchFlow({ inputData });

      expect(result).toStrictEqual({
        exitCode: 2,
        stdout: '',
        stderr: expect.stringMatching(/^BLOCKED: Use the `discover` MCP tool.*\n$/su),
      });
    });
  });

  describe('allowed: content searches', () => {
    it('VALID: {Grep, output_mode: "content"} => returns exitCode 0 with empty stderr', () => {
      const inputData = JSON.stringify({
        session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        transcript_path: '/tmp/transcript.jsonl',
        cwd: process.cwd(),
        hook_event_name: 'PreToolUse',
        tool_name: 'Grep',
        tool_input: { pattern: 'import', output_mode: 'content' },
      });

      const result = HookPreSearchFlow({ inputData });

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
    });

    it('VALID: {Grep, pattern with regex metachar} => returns exitCode 0', () => {
      const inputData = JSON.stringify({
        session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        transcript_path: '/tmp/transcript.jsonl',
        cwd: process.cwd(),
        hook_event_name: 'PreToolUse',
        tool_name: 'Grep',
        tool_input: { pattern: 'import.*from' },
      });

      const result = HookPreSearchFlow({ inputData });

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
    });

    it('VALID: {Glob, pattern: "**/*.json"} => returns exitCode 0', () => {
      const inputData = JSON.stringify({
        session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        transcript_path: '/tmp/transcript.jsonl',
        cwd: process.cwd(),
        hook_event_name: 'PreToolUse',
        tool_name: 'Glob',
        tool_input: { pattern: '**/*.json' },
      });

      const result = HookPreSearchFlow({ inputData });

      expect(result).toStrictEqual({
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
    });
  });

  describe('error handling', () => {
    it('ERROR: {invalid JSON} => returns exitCode 1 with error in stderr', () => {
      const result = HookPreSearchFlow({ inputData: 'not json' });

      expect(result).toStrictEqual({
        exitCode: 1,
        stdout: '',
        stderr: expect.stringMatching(/^Hook error: .*\n(?:.*\n)*$/su),
      });
    });
  });
});
