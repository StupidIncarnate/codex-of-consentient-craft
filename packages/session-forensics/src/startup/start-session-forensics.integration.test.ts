import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { StartSessionForensics } from './start-session-forensics';

describe('StartSessionForensics', () => {
  describe('valid invocation', () => {
    it('VALID: {argv: [summary, target resolving to no transcript]} => writes the rendered text plus a trailing newline to stdout exactly once', () => {
      const stdoutSpy = registerSpyOn({ object: process.stdout, method: 'write' });
      stdoutSpy.calledWith([]).returns(true);
      const originalArgv = process.argv;
      process.argv = [
        'node',
        'start-session-forensics.js',
        'summary',
        'session-forensics-startup-summary-ghost',
      ];

      StartSessionForensics();

      process.argv = originalArgv;

      expect(stdoutSpy.callsMatching([])).toStrictEqual([
        [
          `${[
            'LINES     0',
            'API CALLS 0 (assistant records — one API response spans several transcript lines)',
            'START     (no timestamped record)',
            'MODELS    ',
            '',
            'TOKENS (this transcript only, excludes sub-agents)',
            '  input (uncached)  : 0',
            '  cache_read        : 0',
            '  cache_creation    : 0',
            '  output            : 0',
            '  of which thinking : 0',
            '  TOTAL context-in  : 0',
            '',
            'TOOL CALLS (0)',
            '',
            'TOOL RESULT BYTES 0',
            'SUBAGENTS 0',
          ].join('\n')}\n`,
        ],
      ]);
    });
  });

  describe('failing invocation', () => {
    it('ERROR: {argv naming an empty target} => writes the thrown message to stderr and sets a non-zero exit code', () => {
      const stderrSpy = registerSpyOn({ object: process.stderr, method: 'write' });
      stderrSpy.calledWith([]).returns(true);
      const originalArgv = process.argv;
      const originalExitCode = process.exitCode;
      process.argv = ['node', 'start-session-forensics.js', 'summary', ''];

      StartSessionForensics();

      const { exitCode } = process;
      process.argv = originalArgv;
      process.exitCode = originalExitCode;

      expect(exitCode).toBe(1);
      expect(stderrSpy.callsMatching([])).toStrictEqual([
        [
          `${[
            '[',
            '  {',
            '    "code": "too_small",',
            '    "minimum": 1,',
            '    "type": "string",',
            '    "inclusive": true,',
            '    "exact": false,',
            '    "message": "String must contain at least 1 character(s)",',
            '    "path": []',
            '  }',
            ']',
          ].join('\n')}\n`,
        ],
      ]);
    });
  });
});
