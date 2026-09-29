import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { StartSessionForensics } from './start-session-forensics';
import { argv, getExitCode, setExitCode, stderr, stdout } from '#gateway/node/process';

describe('StartSessionForensics', () => {
  describe('valid invocation', () => {
    it('VALID: {argv: [summary, target resolving to no transcript]} => writes the rendered text plus a trailing newline to stdout exactly once', () => {
      const stdoutSpy = registerSpyOn({ object: stdout, method: 'write' });
      stdoutSpy.calledWith([]).returns(true);
      const originalArgv = [...argv];
      argv.splice(
        0,
        argv.length,
        'node',
        'start-session-forensics.js',
        'summary',
        'session-forensics-startup-summary-ghost',
      );

      StartSessionForensics();

      argv.splice(0, argv.length, ...originalArgv);

      expect(stdoutSpy.callsMatching([])).toStrictEqual([
        [
          `${[
            'Lines in the transcript  0',
            'Times the model replied  0 (one reply covers several lines of the transcript)',
            'Session started          (nothing in the file was timestamped)',
            'Models used              ',
            '',
            'Tokens for this session only. Sub-agents are counted separately.',
            'Cache reads and cache writes are priced differently, so they are counted on separate lines.',
            '  Fed in, not cached       : 0',
            '  Fed in, read from cache  : 0',
            '  Fed in, written to cache : 0',
            '  Written out by the model : 0',
            '  Of that output, thinking : 0',
            '  Total fed into the model : 0',
            '',
            'Tool calls the model made (0 in total)',
            '',
            'Bytes returned by tools  0',
            'Sub-agents started       0',
          ].join('\n')}\n`,
        ],
      ]);
    });
  });

  describe('failing invocation', () => {
    it('ERROR: {argv naming an empty target} => writes the thrown message to stderr and sets a non-zero exit code', () => {
      const stderrSpy = registerSpyOn({ object: stderr, method: 'write' });
      stderrSpy.calledWith([]).returns(true);
      const originalArgv = [...argv];
      setExitCode(0);
      argv.splice(0, argv.length, 'node', 'start-session-forensics.js', 'summary', '');

      StartSessionForensics();

      const exitCode = getExitCode();
      argv.splice(0, argv.length, ...originalArgv);
      setExitCode(0);

      expect(exitCode).toBe(1);
      expect(stderrSpy.callsMatching([])).toStrictEqual([
        [
          `${[
            '[',
            '  {',
            '    "origin": "string",',
            '    "code": "too_small",',
            '    "minimum": 1,',
            '    "inclusive": true,',
            '    "path": [],',
            '    "message": "Too small: expected string to have >=1 characters"',
            '  }',
            ']',
          ].join('\n')}\n`,
        ],
      ]);
    });
  });
});
